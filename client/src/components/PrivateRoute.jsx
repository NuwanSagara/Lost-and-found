import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../lib/authRoles';

const PrivateRoute = ({ allowedRoles = null, unauthorizedTo = null }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    if (!user) return <Navigate to="/login" />;

    if (allowedRoles && !allowedRoles.includes(normalizeRole(user.role))) {
        return <Navigate to={unauthorizedTo || '/unauthorized'} replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
