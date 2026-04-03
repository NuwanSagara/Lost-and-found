import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, USER_ROLES } from '../lib/authRoles';

const AdminRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.6)' }}>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (normalizeRole(user.role) !== USER_ROLES.ADMIN) {
        return <Navigate to="/" replace state={{ accessDenied: true, timestamp: Date.now() }} />;
    }

    return <Outlet />;
};

export default AdminRoute;
