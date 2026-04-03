import React, { createContext, useContext, useEffect, useState } from 'react';
import { normalizeRole } from '../lib/authRoles';
import { applyThemeToRoot, getStoredTheme, normalizeTheme, persistTheme } from '../lib/theme';

const AuthContext = createContext();

const ACTIVE_USER_KEY = 'campusfound_active_user';
const REMEMBER_ME_KEY = 'campusfound_remember_me';
const GEOLOCATION_ERROR_MESSAGES = {
    1: 'Location access is required to complete the Founder Form. Please enable location.',
    2: 'Unable to determine your location right now. You can enter it manually.',
    3: 'Location request timed out. You can enter it manually.',
};
const LOCATION_PERMISSION_HELP = 'Location access is required to complete the Founder Form. Please enable location, or enter the location manually.';

const getApiBaseUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [theme, setThemeState] = useState(() => getStoredTheme());
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle');
    const [locationError, setLocationError] = useState('');
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);

    const syncStoredUser = (nextUser) => {
        setUser(nextUser);
        if (nextUser) {
            localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(nextUser));
        } else {
            localStorage.removeItem(ACTIVE_USER_KEY);
        }
    };

    const persistUserLocation = async ({ token, location }) => {
        if (!token || location?.lat === undefined || location?.lat === null || location?.lng === undefined || location?.lng === null) {
            return null;
        }

        const response = await fetch(`${getApiBaseUrl()}/auth/me/location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                latitude: location.lat,
                longitude: location.lng,
                accuracy: location.accuracy,
                capturedAt: location.capturedAt,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to save your location.');
        }

        return data.location || data.user?.location || null;
    };

    const requestDeviceLocation = () => new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            const message = 'Geolocation is not supported on this device. Enter the location manually.';
            setLocationStatus('unsupported');
            setLocationError(message);
            resolve({ success: false, message });
            return;
        }

        setLocationStatus('requesting');
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const nextLocation = {
                    lat: Number(position.coords.latitude),
                    lng: Number(position.coords.longitude),
                    accuracy: Number(position.coords.accuracy || 0),
                    label: 'Current device location',
                    capturedAt: new Date().toISOString(),
                };

                try {
                    const persistedLocation = await persistUserLocation({
                        token: user?.token,
                        location: nextLocation,
                    });

                    const resolvedLocation = {
                        ...nextLocation,
                        address: persistedLocation?.address || '',
                        city: persistedLocation?.city || '',
                        country: persistedLocation?.country || '',
                        label: persistedLocation?.formattedAddress || persistedLocation?.address || nextLocation.label,
                        capturedAt: persistedLocation?.capturedAt || nextLocation.capturedAt,
                    };

                    setCurrentLocation(resolvedLocation);
                    setLocationStatus('granted');
                    setLocationError('');

                    if (persistedLocation) {
                        setUser((currentUser) => {
                            if (!currentUser) {
                                return currentUser;
                            }

                            const nextUser = { ...currentUser, location: persistedLocation };
                            localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(nextUser));
                            return nextUser;
                        });
                    }

                    resolve({ success: true, location: resolvedLocation });
                } catch (error) {
                    setCurrentLocation(nextLocation);
                    setLocationStatus('granted');
                    setLocationError('');
                    resolve({ success: true, location: nextLocation, warning: error.message });
                }
            },
            (error) => {
                const message = GEOLOCATION_ERROR_MESSAGES[error.code] || 'Unable to access your location. You can enter it manually.';
                setCurrentLocation(null);
                setLocationStatus(error.code === 1 ? 'denied' : 'error');
                setLocationError(message);
                resolve({ success: false, message });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    });

    const promptForDeviceLocation = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            const message = 'Geolocation is not supported on this device. Enter the location manually.';
            setLocationStatus('unsupported');
            setLocationError(message);
            setShowLocationPrompt(false);
            return;
        }

        if (locationStatus === 'denied') {
            setLocationError(LOCATION_PERMISSION_HELP);
            setShowLocationPrompt(false);
            return;
        }

        if (currentLocation || locationStatus === 'requesting') {
            setShowLocationPrompt(false);
            return;
        }

        setShowLocationPrompt(true);
    };

    const acceptLocationPrompt = async () => {
        setShowLocationPrompt(false);
        return requestDeviceLocation();
    };

    const dismissLocationPrompt = () => {
        setShowLocationPrompt(false);
    };

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const savedUser = localStorage.getItem(ACTIVE_USER_KEY);
                if (!savedUser) {
                    return;
                }

                const parsedUser = JSON.parse(savedUser);
                if (!parsedUser?.token) {
                    localStorage.removeItem(ACTIVE_USER_KEY);
                    return;
                }

                const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${parsedUser.token}`,
                    },
                });

                if (!response.ok) {
                    localStorage.removeItem(ACTIVE_USER_KEY);
                    return;
                }

                const me = await response.json();
                const nextUser = {
                    _id: me._id || parsedUser._id,
                    name: me.name,
                    email: me.email,
                    role: normalizeRole(me.role),
                    avatar: me.avatar || '',
                    location: me.location || null,
                    theme: getStoredTheme(me._id || parsedUser._id),
                    token: parsedUser.token,
                };

                syncStoredUser(nextUser);
                setIsLoggedIn(true);
                if (me.location?.latitude && me.location?.longitude) {
                    setCurrentLocation({
                        lat: me.location.latitude,
                        lng: me.location.longitude,
                        accuracy: me.location.accuracy || 0,
                        address: me.location.address || '',
                        city: me.location.city || '',
                        country: me.location.country || '',
                        label: me.location.formattedAddress || me.location.address || 'Current device location',
                        capturedAt: me.location.capturedAt || null,
                    });
                }
                promptForDeviceLocation();
            } catch (error) {
                console.error('Failed to restore auth state', error);
                localStorage.removeItem(ACTIVE_USER_KEY);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    useEffect(() => {
        applyThemeToRoot(theme);
        persistTheme(theme, user?._id);
    }, [theme, user?._id]);

    useEffect(() => {
        if (!user?._id) {
            return;
        }

        const storedTheme = getStoredTheme(user._id);
        setThemeState((currentTheme) => (
            currentTheme === storedTheme ? currentTheme : storedTheme
        ));
    }, [user?._id]);

    const register = async ({ name, studentId, email, password }) => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    studentId,
                    email,
                    password,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, message: data.message || 'Failed to create account.' };
            }

            return { success: true, user: data };
        } catch (error) {
            return { success: false, message: error.message || 'Failed to create account.' };
        }
    };

    const login = async ({ email, password, rememberMe, accountType }) => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, accountType }),
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, message: data.message || 'Invalid email or password' };
            }

            const sessionUser = {
                _id: data._id,
                name: data.name,
                email: data.email,
                role: normalizeRole(data.role),
                avatar: data.avatar || '',
                location: data.location || null,
                theme: getStoredTheme(data._id),
                token: data.token,
                redirectTo: data.redirectTo,
            };

            syncStoredUser(sessionUser);
            localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(Boolean(rememberMe)));
            setIsLoggedIn(true);
            promptForDeviceLocation();

            return { success: true, user: sessionUser };
        } catch (error) {
            return { success: false, message: error.message || 'Login failed.' };
        }
    };

    const logout = () => {
        syncStoredUser(null);
        localStorage.removeItem(REMEMBER_ME_KEY);
        setIsLoggedIn(false);
        setCurrentLocation(null);
        setLocationStatus('idle');
        setLocationError('');
        setShowLocationPrompt(false);
    };

    const setTheme = (nextTheme) => {
        const normalizedTheme = normalizeTheme(nextTheme);
        setThemeState(normalizedTheme);
        setUser((currentUser) => {
            if (!currentUser) {
                return currentUser;
            }

            const nextUser = { ...currentUser, theme: normalizedTheme };
            localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(nextUser));
            return nextUser;
        });
    };

    const updateCurrentUser = (updates) => {
        setUser((current) => {
            if (!current) {
                return current;
            }

            const nextUser = { ...current, ...updates };
            localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(nextUser));
            return nextUser;
        });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isLoggedIn,
                register,
                login,
                logout,
                theme,
                setTheme,
                currentLocation,
                locationStatus,
                locationError,
                locationPermissionHelp: LOCATION_PERMISSION_HELP,
                showLocationPrompt,
                promptForDeviceLocation,
                acceptLocationPrompt,
                dismissLocationPrompt,
                requestDeviceLocation,
                updateCurrentUser,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};
