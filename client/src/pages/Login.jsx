import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Mail, Shield, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../lib/authRoles';

const pageWrapStyle = {
    minHeight: 'calc(100vh - 68px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
};

const cardStyle = {
    width: '100%',
    maxWidth: '460px',
    margin: '0 auto',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '40px 44px',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
    animation: 'fadeSlideUp 0.7s ease forwards',
};

const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    color: '#F8F9FA',
    fontSize: '13px',
    fontWeight: 600,
};

const getInputStyle = (hasError) => ({
    width: '100%',
    height: '52px',
    borderRadius: '12px',
    border: hasError ? '1px solid rgba(255,107,107,0.75)' : '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#F8F9FA',
    padding: '14px 44px 14px 44px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: hasError ? '0 0 0 3px rgba(255,107,107,0.08)' : 'none',
});

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoggedIn, user } = useAuth();
    const [formData, setFormData] = useState({
        accountType: 'NORMAL_USER',
        email: '',
        password: '',
        rememberMe: true,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(Boolean(location.state?.fromSignup));

    useEffect(() => {
        if (!location.state?.fromSignup) {
            return undefined;
        }

        const timer = setTimeout(() => setShowToast(false), 5000);
        window.history.replaceState({}, document.title);
        return () => clearTimeout(timer);
    }, [location.state]);

    useEffect(() => {
        if (isLoggedIn) {
            navigate(getDashboardPath(user?.role));
        }
    }, [isLoggedIn, navigate, user?.role]);

    const updateField = (field, value) => {
        setFormData((current) => ({ ...current, [field]: value }));
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Please enter both your email and password.');
            return;
        }
        setLoading(true);
        setError('');

        const result = await login(formData);

        if (!result.success) {
            setError(result.message);
            setLoading(false);
            return;
        }

        navigate(result.user?.redirectTo || getDashboardPath(result.user?.role));
    };

    return (
        <div style={pageWrapStyle}>
            <div style={cardStyle}>
                {showToast && (
                    <div
                        style={{
                            marginBottom: '20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(81,207,102,0.3)',
                            background: 'rgba(81,207,102,0.12)',
                            color: '#51CF66',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px',
                            animation: 'fadeSlideUp 0.45s ease',
                        }}
                    >
                        <CheckCircle2 size={18} />
                        <span>Account created! Please log in.</span>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            margin: '0 auto 18px',
                            borderRadius: '999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '26px',
                            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                            boxShadow: '0 12px 30px rgba(255,107,53,0.28)',
                        }}
                    >
                        {'\u{1F511}'}
                    </div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '-1.4px' }}>
                        Welcome back
                    </h1>
                    <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                        Log in to your CampusFound account
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
                    <div style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease forwards', animationDelay: '0ms' }}>
                        <label htmlFor="accountType" style={labelStyle}>Account Type</label>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px',
                                padding: '8px',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.03)',
                            }}
                        >
                            {[
                                { value: 'NORMAL_USER', label: 'Normal User', icon: <UserRound size={16} /> },
                                { value: 'ADMIN', label: 'Admin', icon: <Shield size={16} /> },
                            ].map((option) => {
                                const isActive = formData.accountType === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        id={option.value === 'NORMAL_USER' ? 'accountType' : undefined}
                                        type="button"
                                        onClick={() => updateField('accountType', option.value)}
                                        style={{
                                            height: '48px',
                                            borderRadius: '12px',
                                            border: isActive ? '1px solid rgba(255,107,53,0.45)' : '1px solid transparent',
                                            background: isActive ? 'linear-gradient(135deg, rgba(255,107,53,0.18), rgba(255,140,90,0.08))' : 'transparent',
                                            color: isActive ? '#F8F9FA' : 'rgba(255,255,255,0.55)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {option.icon}
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease forwards', animationDelay: '80ms' }}>
                        <label htmlFor="email" style={labelStyle}>University Email</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span
                                style={{
                                    position: 'absolute',
                                    left: '14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: focusedField === 'email' ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                                    transition: 'color 0.2s ease',
                                    zIndex: 1,
                                }}
                            >
                                <Mail size={18} />
                            </span>
                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                placeholder="you@university.edu"
                                onChange={(event) => updateField('email', event.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField('')}
                                style={getInputStyle(Boolean(error))}
                            />
                        </div>
                    </div>

                    <div style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease forwards', animationDelay: '160ms' }}>
                        <label htmlFor="password" style={labelStyle}>Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span
                                style={{
                                    position: 'absolute',
                                    left: '14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: focusedField === 'password' ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                                    transition: 'color 0.2s ease',
                                    zIndex: 1,
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M16 10V7a4 4 0 1 0-8 0v3" />
                                    <rect x="4" y="10" width="16" height="10" rx="2" />
                                </svg>
                            </span>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                placeholder="Enter your password"
                                onChange={(event) => updateField('password', event.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('')}
                                style={getInputStyle(Boolean(error))}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.45)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div
                            style={{
                                marginTop: '-6px',
                                color: '#FF9A9A',
                                fontSize: '12px',
                                lineHeight: 1.4,
                                animation: 'fadeSlideUp 0.25s ease',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            flexWrap: 'wrap',
                            opacity: 0,
                            animation: 'fadeSlideUp 0.6s ease forwards',
                            animationDelay: '240ms',
                        }}
                    >
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.72)', fontSize: '13px' }}>
                            <input
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={(event) => updateField('rememberMe', event.target.checked)}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    accentColor: '#FF6B35',
                                }}
                            />
                            Remember me
                        </label>
                        <button
                            type="button"
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.35)',
                                fontSize: '12px',
                                padding: 0,
                                cursor: 'pointer',
                            }}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            height: '52px',
                            marginTop: '6px',
                            border: 'none',
                            borderRadius: '100px',
                            background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: 600,
                            boxShadow: '0 8px 32px rgba(255,107,53,0.35)',
                            cursor: loading ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                            opacity: loading ? 0.92 : 1,
                        }}
                    >
                        {loading && (
                            <span
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '999px',
                                    border: '2px solid rgba(255,255,255,0.34)',
                                    borderTopColor: '#fff',
                                    animation: 'spin 0.8s linear infinite',
                                }}
                            />
                        )}
                        {loading ? 'Logging in...' : 'Log In to CampusFound'}
                    </button>
                </form>

                <p style={{ marginTop: '22px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
                    Don&apos;t have an account?{' '}
                    <Link to="/signup" style={{ color: '#FF6B35', textDecoration: 'none', fontWeight: 600 }}>
                        {'Sign Up \u2192'}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
