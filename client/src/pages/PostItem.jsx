import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import {
    AlertCircle,
    Calendar,
    Camera,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    Info,
    MapPin,
    Navigation,
    Search,
    UserMinus,
    UploadCloud,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SLIIT_CAMPUS_CENTER = [6.9147, 79.9729];
const SLIIT_CAMPUS_BOUNDS = [
    [6.9118, 79.9699],
    [6.9178, 79.9761],
];

const MapViewportUpdater = ({ position }) => {
    const map = useMap();

    useEffect(() => {
        if (!position) {
            return;
        }

        map.setView(position, map.getZoom(), { animate: true });
    }, [map, position]);

    return null;
};

const LocationMap = ({ position, onLocationSelect }) => {
    const MapClickHandler = () => {
        useMapEvents({
            click(e) {
                onLocationSelect([e.latlng.lat, e.latlng.lng]);
            },
        });
        return null;
    };
    return (
        <MapContainer
            center={position || SLIIT_CAMPUS_CENTER}
            zoom={17}
            minZoom={16}
            maxZoom={19}
            maxBounds={SLIIT_CAMPUS_BOUNDS}
            maxBoundsViscosity={1}
            style={{ height: '300px', width: '100%', borderRadius: '12px', zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapViewportUpdater position={position} />
            {position && <Marker position={position} />}
            <MapClickHandler />
        </MapContainer>
    );
};

const STEPS = [
    { id: 1, title: 'Item Type', icon: Info },
    { id: 2, title: 'Details', icon: FileText },
    { id: 3, title: 'Location', icon: MapPin },
];

const CATEGORIES = [
    'Electronics',
    'Phone',
    'Laptop',
    'Earbuds',
    'Tablet',
    'Bag',
    'Backpack',
    'Wallet',
    'Keys',
    'Clothing',
    'Jewelry',
    'ID Card',
    'Book',
    'Other',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const formatCoordinate = (value) => Number(value).toFixed(6);

const createInitialFormData = (type) => ({
    type,
    category: 'Other',
    title: '',
    description: '',
    location: '',
    lat: '',
    lng: '',
    locationSource: 'manual',
    dateLost: '',
    dateFound: '',
    image: '',
    urgency: 'Normal',
    isAnonymous: false,
});

const buildImagePreviewUrl = (item) => {
    if (item?.image?.base64) {
        return `data:image/jpeg;base64,${item.image.base64}`;
    }

    if (item?.image?.url) {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        return `${apiBase.replace(/\/api$/, '')}${item.image.url}`;
    }

    return '';
};

const buildEditFormData = (item) => {
    const [lng, lat] = item?.location?.coordinates?.coordinates || [];
    const imagePreviewUrl = buildImagePreviewUrl(item);

    return {
        type: item?.type || 'lost',
        category: item?.category || 'Other',
        title: item?.title || '',
        description: item?.description || '',
        location: item?.location?.name || '',
        lat: lat ?? '',
        lng: lng ?? '',
        locationSource: item?.location?.source || 'manual',
        dateLost: item?.type === 'lost' && item?.reportedAt ? String(item.reportedAt).slice(0, 10) : '',
        dateFound: item?.type === 'found' && item?.reportedAt ? String(item.reportedAt).slice(0, 10) : '',
        image: imagePreviewUrl,
        urgency: item?.urgency || 'Normal',
        isAnonymous: Boolean(item?.isAnonymous),
    };
};

const getLocationPermissionMessage = (status, currentLocation, errorMessage) => {
    if (status === 'requesting') {
        return 'Requesting your current location...';
    }

    if (status === 'granted' && currentLocation) {
        return `Using current coordinates: ${formatCoordinate(currentLocation.lat)}, ${formatCoordinate(currentLocation.lng)}`;
    }

    return errorMessage || 'Allow location access to auto-fill this form, or type the location manually.';
};

const getDeviceLocationFromSources = (currentLocation, profileLocation) => {
    if (currentLocation?.lat !== undefined && currentLocation?.lng !== undefined) {
        return currentLocation;
    }

    if (
        profileLocation?.latitude !== null &&
        profileLocation?.latitude !== undefined &&
        profileLocation?.longitude !== null &&
        profileLocation?.longitude !== undefined
    ) {
        return {
            lat: profileLocation.latitude,
            lng: profileLocation.longitude,
            accuracy: profileLocation.accuracy || 0,
            address: profileLocation.address || '',
            city: profileLocation.city || '',
            country: profileLocation.country || '',
            label: profileLocation.formattedAddress || profileLocation.address || 'Current device location',
            capturedAt: profileLocation.capturedAt || null,
        };
    }

    return null;
};

const PostItem = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: editItemId } = useParams();
    const {
        user,
        currentLocation,
        locationStatus,
        locationError,
        locationPermissionHelp,
        promptForDeviceLocation,
        requestDeviceLocation,
    } = useAuth();
    const fileInputRef = useRef(null);

    const routeType = useMemo(() => {
        if (location.pathname.startsWith('/lost-items/edit/')) return 'lost';
        if (location.pathname === '/post-found') return 'found';
        return 'lost';
    }, [location.pathname]);
    const isEditing = Boolean(editItemId);

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [formData, setFormData] = useState(() => createInitialFormData(routeType));
    const [imageName, setImageName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState({ category: '', locations: [] });
    const [previewMatches, setPreviewMatches] = useState(null);
    const [mapPosition, setMapPosition] = useState(null);
    const [pendingUseCurrentLocation, setPendingUseCurrentLocation] = useState(false);
    const [loadingExistingItem, setLoadingExistingItem] = useState(false);
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [imageChanged, setImageChanged] = useState(false);

    useEffect(() => {
        if (step !== 2 || !formData.description) return;
        
        const text = formData.description.toLowerCase();
        let cat = '';
        if (/(laptop|phone|charger|tablet|earbuds|airpods|headphone|ipad|macbook|samsung|iphone)/.test(text)) cat = 'Electronics';
        else if (/(wallet|purse|cash|money|card|bag|backpack)/.test(text)) cat = /(bag|backpack)/.test(text) ? 'Bag' : 'Wallet';
        else if (/(id|student card|passport|license)/.test(text)) cat = 'ID Card';
        else if (/(key|keys|apartment|car)/.test(text)) cat = 'Keys';
        else if (/(bottle|umbrella|sunglasses|glasses|lunch box)/.test(text)) cat = 'Other';

        const locs = [];
        if (/(it building|it dpt|it faculty|it)/.test(text)) locs.push('IT Building');
        if (/(library|lib)/.test(text)) locs.push('Library');
        if (/(auditorium|main hall)/.test(text)) locs.push('Auditorium');
        if (/(canteen|cafeteria)/.test(text)) locs.push('Canteen');
        if (/(lab 1|lab 2|labs)/.test(text)) locs.push('Labs');
        if (/(security)/.test(text)) locs.push('Security Office');

        setSmartSuggestions({
            category: cat && cat !== formData.category ? cat : '',
            locations: locs.filter(l => !formData.location.includes(l))
        });
    }, [formData.description, formData.category, formData.location, step]);

    useEffect(() => {
        setFormData((current) => ({
            ...createInitialFormData(routeType),
            category: current.category || 'Other',
        }));
        setImageName('');
        setError('');
        setStep(1);
        setMapPosition(null);
        setPendingUseCurrentLocation(false);
        setExistingImageUrl('');
        setImageChanged(false);
    }, [routeType, isEditing]);

    useEffect(() => {
        if (!isEditing || !editItemId || !user?.token) {
            return;
        }

        let isMounted = true;

        const loadExistingItem = async () => {
            try {
                setLoadingExistingItem(true);
                setError('');

                const response = await fetch(`${import.meta.env.VITE_API_URL}/items/${editItemId}`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to load report for editing.');
                }

                if (!isMounted) {
                    return;
                }

                const item = data.item;
                const nextFormData = buildEditFormData(item);

                setFormData(nextFormData);
                setImageName(item?.image?.url ? 'Current image' : '');
                setExistingImageUrl(nextFormData.image);
                setImageChanged(false);
                setStep(1);
                setPreviewMatches(null);
                setMapPosition(nextFormData.lat !== '' && nextFormData.lng !== '' ? [nextFormData.lat, nextFormData.lng] : null);
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError.message || 'Failed to load report for editing.');
                }
            } finally {
                if (isMounted) {
                    setLoadingExistingItem(false);
                }
            }
        };

        loadExistingItem();

        return () => {
            isMounted = false;
        };
    }, [editItemId, isEditing, user?.token]);

    useEffect(() => {
        const activeLocation = getDeviceLocationFromSources(currentLocation, user?.location);

        if (!activeLocation) {
            return;
        }

        setFormData((current) => {
            const nextLocationName = current.location.trim() || activeLocation.label;
            return {
                ...current,
                location: current.locationSource === 'manual' && current.location.trim()
                    ? current.location
                    : nextLocationName,
                lat: activeLocation.lat,
                lng: activeLocation.lng,
                locationSource: 'device',
            };
        });

        if (pendingUseCurrentLocation || !mapPosition) {
            setMapPosition([activeLocation.lat, activeLocation.lng]);
            setPendingUseCurrentLocation(false);
        }
    }, [currentLocation, mapPosition, pendingUseCurrentLocation, user?.location]);

    const dateFieldName = formData.type === 'lost' ? 'dateLost' : 'dateFound';
    const dateLabel = formData.type === 'lost' ? 'Date Lost' : 'Date Found';
    const locationLabel = formData.type === 'lost' ? 'Where was it last seen?' : 'Where was it found?';
    const submitLabel = isEditing
        ? (formData.type === 'lost' ? 'Update Lost Item' : 'Update Found Item')
        : (formData.type === 'lost' ? 'Post Lost Item' : 'Post Found Item');
    const successLabel = formData.type === 'lost' ? 'lost' : 'found';

    const slideVariants = {
        enter: (currentDirection) => ({
            x: currentDirection > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.98,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: 'easeOut' },
        },
        exit: (currentDirection) => ({
            x: currentDirection < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.3 },
        }),
    };

    const updateField = (name, value) => {
        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleLocationInputChange = (value) => {
        setFormData((current) => ({
            ...current,
            location: value,
            locationSource: current.lat && current.lng && current.locationSource === 'device'
                ? current.locationSource
                : 'manual',
        }));
    };

    const handleTypeChange = (type) => {
        setFormData((current) => ({
            ...current,
            type,
            dateLost: type === 'lost' ? current.dateLost : '',
            dateFound: type === 'found' ? current.dateFound : '',
        }));
        setError('');
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            if (isEditing && existingImageUrl) {
                updateField('image', existingImageUrl);
                setImageName('Current image');
                setImageChanged(false);
            } else {
                updateField('image', '');
                setImageName('');
                setImageChanged(false);
            }
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please choose a valid image file.');
            event.target.value = '';
            if (isEditing && existingImageUrl) {
                updateField('image', existingImageUrl);
                setImageName('Current image');
                setImageChanged(false);
            } else {
                updateField('image', '');
                setImageName('');
            }
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError('Image must be smaller than 5MB.');
            event.target.value = '';
            if (isEditing && existingImageUrl) {
                updateField('image', existingImageUrl);
                setImageName('Current image');
                setImageChanged(false);
            } else {
                updateField('image', '');
                setImageName('');
            }
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setError('');
            setImageName(file.name);
            setImageChanged(true);
            updateField('image', reader.result);
        };
        reader.readAsDataURL(file);
    };

    const validateStep = () => {
        if (step === 1 && !formData.category) {
            setError('Please choose a category.');
            return false;
        }

        if (step === 2) {
            if (!formData.title.trim() || !formData.description.trim()) {
                setError('Please add both a title and a description.');
                return false;
            }

            if (!formData.image) {
                setError('Please upload an image before continuing.');
                return false;
            }
        }

        if (step === 3) {
            const hasManualLocationName = Boolean(formData.location.trim());
            const hasCoordinates = formData.lat !== '' && formData.lng !== '';
            if ((!hasManualLocationName && !hasCoordinates) || !formData[dateFieldName]) {
                setError('Please provide the location and date.');
                return false;
            }
        }

        setError('');
        return true;
    };

    const triggerSuccessEffects = () => {
        const duration = 2500;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#6C63FF', '#00D4AA', '#FF6B6B'],
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#6C63FF', '#00D4AA', '#FF6B6B'],
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();
    };

    const submitForm = async () => {
        if (!validateStep()) {
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            if (!user?.token) {
                throw new Error('Please log in again before submitting a report.');
            }

            const payload = new FormData();
            payload.append('type', formData.type);
            payload.append('title', formData.title.trim());
            payload.append('category', formData.category);
            payload.append('description', formData.description.trim());
            payload.append('location', formData.location.trim());
            payload.append('location_name', formData.location.trim());
            if (formData.lat && formData.lng) {
                payload.append('lat', formData.lat);
                payload.append('lng', formData.lng);
                payload.append('location_source', formData.locationSource || 'manual');
                if (formData.locationSource === 'device' && currentLocation?.accuracy) {
                    payload.append('location_accuracy', currentLocation.accuracy);
                }
            } else {
                payload.append('location_source', 'manual');
            }
            if (formData.type === 'lost') {
                payload.append('urgency', formData.urgency);
            } else {
                payload.append('isAnonymous', formData.isAnonymous);
            }
            payload.append('event_date', formData[dateFieldName]);
            if (!isEditing || imageChanged) {
                payload.append('image_base64', formData.image);
            }

            const request = isEditing
                ? axios.put(`${import.meta.env.VITE_API_URL}/items/${editItemId}`, payload, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                })
                : axios.post(`${import.meta.env.VITE_API_URL}/items`, payload, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

            await request;
            setImageChanged(false);
            if (isEditing) {
                navigate('/user/dashboard', {
                    state: {
                        refreshAt: Date.now(),
                        updatedItemId: editItemId,
                        successMessage: `${formData.type === 'lost' ? 'Lost' : 'Found'} item report updated successfully.`,
                    },
                });
                return;
            }

            setIsSuccess(true);
            triggerSuccessEffects();
        } catch (submitError) {
            setError(submitError.response?.data?.message || submitError.message || `Failed to ${isEditing ? 'update' : 'post'} ${successLabel} item.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (!validateStep()) {
            return;
        }

        if (step < STEPS.length) {
            setDirection(1);
            setStep((current) => current + 1);
        } else {
            if (!isEditing && formData.type === 'lost' && previewMatches === null) {
                setIsSubmitting(true);
                axios.get(`${import.meta.env.VITE_API_URL}/items?type=found&status=open&limit=3&category=${formData.category}`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                })
                    .then(res => {
                        const similar = res.data.items || [];
                        if (similar.length > 0) {
                            setPreviewMatches(similar);
                        } else {
                            submitForm();
                        }
                    })
                    .catch(() => submitForm())
                    .finally(() => setIsSubmitting(false));
            } else {
                submitForm();
            }
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setError('');
            setDirection(-1);
            setStep((current) => current - 1);
        }
    };

    const handleUseCurrentLocation = async () => {
        const savedDeviceLocation = getDeviceLocationFromSources(currentLocation, user?.location);

        if (locationStatus === 'denied') {
            setError('');
            return;
        }

        if (savedDeviceLocation) {
            setFormData((current) => ({
                ...current,
                location: savedDeviceLocation.label || current.location || 'Current device location',
                lat: savedDeviceLocation.lat,
                lng: savedDeviceLocation.lng,
                locationSource: 'device',
            }));
            setMapPosition([savedDeviceLocation.lat, savedDeviceLocation.lng]);
            setPendingUseCurrentLocation(false);
            setError('');
            return;
        }

        if (!currentLocation && locationStatus === 'idle') {
            setPendingUseCurrentLocation(true);
            promptForDeviceLocation();
            return;
        }

        setPendingUseCurrentLocation(true);
        const result = await requestDeviceLocation();
        if (!result.success) {
            setPendingUseCurrentLocation(false);
            setError(result.message);
        }
    };

    if (loadingExistingItem) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
                <div className="glass-panel p-10 rounded-3xl border border-surface-glass-border text-center">
                    <p className="text-text-muted">Loading report...</p>
                </div>
            </div>
        );
    }

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-display font-bold text-white mb-4">What are you reporting?</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('lost')}
                                    className={cn(
                                        'p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3',
                                        formData.type === 'lost'
                                            ? 'border-tag-lost bg-tag-lost/10 shadow-[0_0_20px_rgba(255,107,107,0.2)]'
                                            : 'border-surface-glass-border bg-black/20 hover:border-white/20'
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-full bg-tag-lost/20 flex items-center justify-center text-tag-lost">
                                        <Search size={24} />
                                    </div>
                                    <span className="font-bold text-white">Lost an Item</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('found')}
                                    className={cn(
                                        'p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3',
                                        formData.type === 'found'
                                            ? 'border-tag-found bg-tag-found/10 shadow-[0_0_20px_rgba(81,207,102,0.2)]'
                                            : 'border-surface-glass-border bg-black/20 hover:border-white/20'
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-full bg-tag-found/20 flex items-center justify-center text-tag-found">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <span className="font-bold text-white">Found an Item</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-display font-bold text-white mb-4">Category</h3>
                            <div className="flex flex-wrap gap-3">
                                {CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => updateField('category', category)}
                                        className={cn(
                                            'px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                                            formData.category === category
                                                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                                : 'bg-black/20 text-text-muted border-surface-glass-border hover:border-white/30 hover:text-white'
                                        )}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 block">Item Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Leather wallet with student ID"
                                value={formData.title}
                                onChange={(event) => updateField('title', event.target.value)}
                                className="w-full bg-black/20 border border-surface-glass-border rounded-xl p-4 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-brand-primary focus:shadow-[0_0_15px_rgba(108,99,255,0.2)] transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 block">Description</label>
                            <textarea
                                placeholder="Describe colors, brand, identifying marks, and anything helpful."
                                value={formData.description}
                                onChange={(event) => updateField('description', event.target.value)}
                                className="w-full bg-black/20 border border-surface-glass-border rounded-xl p-4 min-h-[120px] resize-none text-white placeholder:text-text-muted/50 focus:outline-none focus:border-brand-primary focus:shadow-[0_0_15px_rgba(108,99,255,0.2)] transition-all"
                            />
                            {(smartSuggestions.category || smartSuggestions.locations.length > 0) ? (
                                <div className="mt-3 flex flex-wrap gap-2 items-center">
                                    <span className="text-xs text-brand-secondary font-semibold">✨ Smart Suggestions:</span>
                                    {smartSuggestions.category && (
                                        <button type="button" onClick={() => updateField('category', smartSuggestions.category)} className="text-xs px-2 py-1 bg-brand-secondary/20 text-brand-secondary rounded border border-brand-secondary/50 hover:bg-brand-secondary/30 transition-colors">
                                            Set Category: {smartSuggestions.category}
                                        </button>
                                    )}
                                    {smartSuggestions.locations.map(loc => (
                                        <button key={loc} type="button" onClick={() => updateField('location', formData.location ? `${formData.location}, ${loc}` : loc)} className="text-xs px-2 py-1 bg-brand-primary/20 text-brand-primary rounded border border-brand-primary/50 hover:bg-brand-primary/30 transition-colors">
                                            Add Location: {loc}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div>
                            <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 block">Upload Photo</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-surface-glass-border rounded-2xl p-8 hover:border-brand-primary/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-black/10 hover:bg-black/20 group"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-brand-primary/20 transition-colors text-text-muted group-hover:text-brand-primary">
                                    {formData.image ? <UploadCloud size={28} /> : <Camera size={28} />}
                                </div>
                                <h4 className="text-white font-medium mb-1">
                                    {imageName ? 'Change selected image' : 'Click to upload an image'}
                                </h4>
                                <p className="text-sm text-text-muted">
                                    {imageName || 'JPEG, PNG, or other image files up to 5MB.'}
                                </p>
                            </button>

                            {formData.image && (
                                <div className="mt-4 space-y-3">
                                    <img
                                        src={formData.image}
                                        alt="Selected item"
                                        className="h-48 w-full rounded-2xl object-cover border border-white/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditing && existingImageUrl) {
                                                updateField('image', existingImageUrl);
                                                setImageName('Current image');
                                                setImageChanged(false);
                                            } else {
                                                updateField('image', '');
                                                setImageName('');
                                                setImageChanged(false);
                                            }
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        className="text-sm text-text-muted hover:text-white transition-colors"
                                    >
                                        {isEditing && existingImageUrl ? 'Revert to current image' : 'Remove image'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {formData.type === 'lost' ? (
                            <div>
                                <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 block">Urgency</label>
                                <div className="flex bg-black/20 p-1 rounded-xl border border-surface-glass-border">
                                    <button
                                        type="button"
                                        onClick={() => updateField('urgency', 'Normal')}
                                        className={cn(
                                            'flex-1 py-3 text-sm font-medium rounded-lg transition-colors',
                                            formData.urgency === 'Normal'
                                                ? 'bg-white shadow text-gray-900'
                                                : 'text-text-muted hover:text-white'
                                        )}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateField('urgency', 'Important')}
                                        className={cn(
                                            'flex-1 py-3 text-sm font-medium rounded-lg transition-colors border',
                                            formData.urgency === 'Important'
                                                ? 'bg-yellow-100/10 text-yellow-400 shadow border-yellow-400/30'
                                                : 'text-text-muted hover:text-white border-transparent'
                                        )}
                                    >
                                        Important
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateField('urgency', 'Emergency')}
                                        className={cn(
                                            'flex-1 py-3 text-sm font-medium rounded-lg transition-colors border',
                                            formData.urgency === 'Emergency'
                                                ? 'bg-red-500/10 text-red-400 shadow border-red-500/30'
                                                : 'text-text-muted hover:text-white border-transparent'
                                        )}
                                    >
                                        Emergency
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex items-start gap-3 rounded-2xl border border-surface-glass-border bg-black/20 p-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isAnonymous}
                                    onChange={(event) => updateField('isAnonymous', event.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-surface-glass-border bg-transparent"
                                />
                                <div>
                                    <div className="flex items-center gap-2 text-white font-medium">
                                        <UserMinus size={16} />
                                        Report anonymously
                                    </div>
                                    <p className="text-sm text-text-muted mt-1">
                                        Your name stays hidden from the public post.
                                    </p>
                                </div>
                            </label>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 block">{locationLabel}</label>
                            <div className="relative mb-4">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary" size={20} />
                                <input
                                    type="text"
                                    placeholder="e.g. Main library, floor 2"
                                    value={formData.location}
                                    onChange={(event) => handleLocationInputChange(event.target.value)}
                                    className="w-full bg-black/20 border border-surface-glass-border rounded-xl p-4 pl-12 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-brand-primary transition-all"
                                />
                            </div>
                            <div className="mb-4 rounded-2xl border border-surface-glass-border bg-black/20 p-4 text-sm">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-semibold text-white">Device location</p>
                                        <p className="mt-1 text-text-muted">
                                            {getLocationPermissionMessage(locationStatus, currentLocation, locationError)}
                                        </p>
                                        <p className="mt-2 text-xs text-text-muted">
                                            Saved source: {formData.locationSource === 'device' ? 'Device location' : 'Manual entry'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUseCurrentLocation}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-primary/40 bg-brand-primary/10 px-4 py-2 font-medium text-brand-primary transition-colors hover:bg-brand-primary/20"
                                    >
                                        <Navigation size={16} />
                                        Use Current Location
                                    </button>
                                </div>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-surface-glass-border z-0 relative">
                                <LocationMap
                                    position={mapPosition || (formData.lat && formData.lng ? [formData.lat, formData.lng] : null)}
                                    onLocationSelect={(pos) => {
                                        updateField('lat', pos[0]);
                                        updateField('lng', pos[1]);
                                        setMapPosition(pos);
                                        if (!formData.location.trim()) {
                                            updateField('location', `Pinned on map (${formatCoordinate(pos[0])}, ${formatCoordinate(pos[1])})`);
                                        }
                                        updateField('locationSource', 'manual');
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-text-muted text-center flex items-center justify-center gap-1">
                                <MapPin size={12}/> Your current location is filled automatically when permission is granted. If not, type it manually or pick a point on the map.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 block">{dateLabel}</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary" size={20} />
                                <input
                                    type="date"
                                    value={formData[dateFieldName]}
                                    onChange={(event) => updateField(dateFieldName, event.target.value)}
                                    className="w-full bg-black/20 border border-surface-glass-border rounded-xl p-4 pl-12 text-white focus:outline-none focus:border-brand-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-surface-glass-border bg-black/20 p-5">
                            <h4 className="text-white font-semibold mb-3">Ready to submit</h4>
                            <div className="space-y-2 text-sm text-text-muted">
                                <p><span className="text-white">Type:</span> {formData.type}</p>
                                <p><span className="text-white">Category:</span> {formData.category}</p>
                                <p><span className="text-white">Location:</span> {formData.location || 'Current device location'}</p>
                                <p><span className="text-white">Image:</span> {imageName || 'Attached'}</p>
                            </div>
                        </div>
                        
                        {previewMatches && previewMatches.length > 0 && (
                            <div className="bg-brand-primary/10 border border-brand-primary/30 p-6 rounded-2xl mt-4">
                                <h3 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2">
                                    <Search className="text-brand-primary" /> Similar Found Items
                                </h3>
                                <p className="text-text-muted text-sm mb-6">
                                    Before you submit, check if any of these already found items might be yours.
                                </p>
                                <div className="space-y-4">
                                    {previewMatches.map(m => (
                                        <div key={m._id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-black/40 border border-surface-glass-border items-start">
                                            {m.image?.url && <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${m.image.url}`} alt={m.title} className="w-16 h-16 rounded-lg object-cover" />}
                                            <div>
                                                <h4 className="text-white font-bold text-sm sm:text-base">{m.title}</h4>
                                                <p className="text-xs text-text-muted line-clamp-1">{m.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-10 rounded-3xl border border-surface-glass-border text-center max-w-md w-full"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                        className={cn(
                            'w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6',
                            formData.type === 'lost' ? 'bg-tag-lost/20 text-tag-lost' : 'bg-tag-found/20 text-tag-found'
                        )}
                    >
                        <CheckCircle2 size={48} />
                    </motion.div>
                    <h2 className="text-3xl font-display font-bold text-white mb-4">Report Submitted!</h2>
                    <p className="text-text-muted mb-8 text-lg">
                        Your {successLabel} item report has been posted successfully.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link to="/dashboard" className="block w-full">
                            <Button className="w-full py-6 text-lg">Go to Dashboard</Button>
                        </Link>
                        <button
                            type="button"
                            onClick={() => navigate('/search')}
                            className="text-sm text-text-muted hover:text-white transition-colors"
                        >
                            Browse all posts
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
            <div className="mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-glass-border -translate-y-1/2 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-brand-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                </div>
                <div className="relative z-10 flex justify-between">
                    {STEPS.map((currentStep) => (
                        <div key={currentStep.id} className="flex flex-col items-center gap-3">
                            <div
                                className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-[#0a0a0f]',
                                    step >= currentStep.id
                                        ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(108,99,255,0.4)]'
                                        : 'bg-black/40 text-text-muted'
                                )}
                            >
                                <currentStep.icon size={20} />
                            </div>
                            <span
                                className={cn(
                                    'text-xs font-bold uppercase tracking-wider hidden sm:block',
                                    step >= currentStep.id ? 'text-white' : 'text-text-muted'
                                )}
                            >
                                {currentStep.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-surface-glass-border shadow-2xl relative overflow-hidden min-h-[400px]">
                <div className="mb-6">
                    <h1 className="text-3xl font-display font-bold text-white">
                        {formData.type === 'lost' ? 'Report a Lost Item' : 'Report a Found Item'}
                    </h1>
                    <p className="text-text-muted mt-2">
                        Add the details below and include a photo so others can identify it quickly.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex items-start gap-3">
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>

                <div className="mt-12 pt-6 border-t border-surface-glass-border flex justify-between items-center sm:flex-row flex-col gap-4">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={prevStep} className="gap-2 w-full sm:w-auto">
                            <ChevronLeft size={18} /> Back
                        </Button>
                    ) : (
                        <div className="hidden sm:block" />
                    )}

                    {previewMatches && previewMatches.length > 0 ? (
                        <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
                            <Button variant="outline" onClick={() => setPreviewMatches(null)} className="flex-1 min-w-[140px]">Edit Report</Button>
                            <Button onClick={() => submitForm()} disabled={isSubmitting} className="flex-1 min-w-[180px]">Submit Anyway</Button>
                        </div>
                    ) : (
                        <Button onClick={nextStep} disabled={isSubmitting} className="gap-2 w-full sm:w-auto min-w-[160px]">
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : step === STEPS.length ? (
                                submitLabel
                            ) : (
                                <>
                                    Continue <ChevronRight size={18} />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostItem;
