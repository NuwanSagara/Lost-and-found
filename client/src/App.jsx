import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BackgroundEffects from './components/BackgroundEffects';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import ItemDetail from './pages/ItemDetail';
import Dashboard from './pages/Dashboard';
import UserDetails from './pages/UserDetails';
import AdminDashboard from './pages/AdminDashboard';
import PostItem from './pages/PostItem';
import ClaimItem from './pages/ClaimItem';
import ClaimDetail from './pages/ClaimDetail';
import Chat from './pages/Chat';
import About from './pages/About';
import Unauthorized from './pages/Unauthorized';
import { getDashboardPath, USER_ROLES } from './lib/authRoles';
import { Button } from './components/ui/Button';

const Notifications = () => (
    <div className="max-w-7xl mx-auto px-4 py-24 min-h-screen flex items-center justify-center">
        <div className="glass-panel p-10 rounded-3xl border border-surface-glass-border text-center">
            <h2 className="text-2xl font-display text-text-primary mb-2">Notifications Center</h2>
            <p className="text-text-muted">Coming soon in Phase 4.</p>
        </div>
    </div>
);

const RoleDashboardRedirect = () => {
    const { user } = useAuth();
    return <Navigate to={getDashboardPath(user?.role)} replace />;
};

const AccessDeniedToast = ({ onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3500);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 82,
                right: 24,
                zIndex: 200,
                background: 'rgba(255,77,77,0.12)',
                border: '1px solid rgba(255,77,77,0.35)',
                borderRadius: 14,
                color: 'var(--color-text-primary)',
                padding: '12px 16px',
                fontSize: 13,
                backdropFilter: 'blur(12px)',
            }}
        >
            Access Denied
        </div>
    );
};

const LocationPermissionPrompt = () => {
    const {
        showLocationPrompt,
        acceptLocationPrompt,
        dismissLocationPrompt,
        locationStatus,
    } = useAuth();

    if (!showLocationPrompt || locationStatus === 'granted') {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md rounded-3xl border border-surface-glass-border p-6 sm:p-8 shadow-2xl">
                <h2 className="text-2xl font-display text-text-primary mb-3">Allow Device Location</h2>
                <p className="text-text-muted mb-6">
                    Let CampusFound use your current device location so we can auto-fill report forms and save more accurate item locations. You can still enter the location manually if you skip this.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={acceptLocationPrompt} className="flex-1">
                        Allow Location
                    </Button>
                    <Button variant="outline" onClick={dismissLocationPrompt} className="flex-1">
                        Not Now
                    </Button>
                </div>
            </div>
        </div>
    );
};

const AppShell = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showDeniedToast, setShowDeniedToast] = useState(false);
    const isAdminRoute = location.pathname.startsWith('/admin');

    useEffect(() => {
        if (location.state?.accessDenied) {
            setShowDeniedToast(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate]);

    return (
        <div className="min-h-screen flex flex-col font-sans bg-bg-dark text-text-primary selection:bg-brand-primary/30">
            <BackgroundEffects />

            {showDeniedToast ? <AccessDeniedToast onDismiss={() => setShowDeniedToast(false)} /> : null}
            <LocationPermissionPrompt />
            {!isAdminRoute ? <Navbar /> : null}

            <main className="flex-grow w-full">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Register />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/items" element={<Search />} />
                    <Route path="/items/:id" element={<ItemDetail />} />

                    <Route element={<PrivateRoute />}>
                        <Route path="/dashboard" element={<RoleDashboardRedirect />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/chat/:id" element={<Chat />} />
                    </Route>
                    <Route element={<PrivateRoute allowedRoles={[USER_ROLES.USER]} unauthorizedTo="/unauthorized" />}>
                        <Route path="/user/dashboard" element={<Dashboard />} />
                        <Route path="/user/details" element={<UserDetails />} />
                        <Route path="/member/dashboard" element={<Navigate to="/user/dashboard" replace />} />
                        <Route path="/finder/dashboard" element={<Navigate to="/user/dashboard" replace />} />
                    </Route>
                    <Route element={<AdminRoute />}>
                        <Route path="/admin/*" element={<AdminDashboard />} />
                    </Route>
                    <Route element={<PrivateRoute allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]} unauthorizedTo="/unauthorized" />}>
                        <Route path="/post-lost" element={<PostItem />} />
                        <Route path="/lost-items/edit/:id" element={<PostItem />} />
                        <Route path="/report" element={<PostItem />} />
                        <Route path="/post-found" element={<PostItem />} />
                        <Route path="/claim/:id" element={<ClaimItem />} />
                        <Route path="/claims/:id" element={<ClaimDetail />} />
                    </Route>
                </Routes>
            </main>

            {!isAdminRoute ? (
                <footer className="border-t border-surface-glass-border bg-black/50 backdrop-blur-md mt-auto">
                    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-tag-found"></span>
                            <span className="font-display font-bold text-text-primary tracking-tight">Campus<span className="text-brand-primary">Found</span></span>
                        </div>
                        <p className="text-sm text-text-muted">
                            &copy; {new Date().getFullYear()} CampusFound. All rights reserved.
                        </p>
                        <div className="flex gap-4 text-sm text-text-muted">
                            <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
                            <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
                        </div>
                    </div>
                </footer>
            ) : null}
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppShell />
            </AuthProvider>
        </Router>
    );
}

export default App;
