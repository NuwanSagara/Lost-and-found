import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, IdCard, Mail, User } from 'lucide-react';
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

const fieldWrapperBase = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
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
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
    boxShadow: hasError ? '0 0 0 3px rgba(255,107,107,0.08)' : 'none',
});

const inlineErrorStyle = {
    marginTop: '8px',
    color: '#FF8E8E',
    fontSize: '12px',
    lineHeight: 1.4,
};

const footerTextStyle = {
    marginTop: '22px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '14px',
};

const fieldAnimations = [0, 80, 160, 240, 320];

const getPasswordStrength = (password) => {
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasLength, hasNumber, hasSpecial].filter(Boolean).length;

    if (!password) {
        return { label: '', color: 'transparent', width: '0%' };
    }

    if (score <= 1) {
        return { label: 'Weak', color: '#FF6B6B', width: '33%' };
    }

    if (score === 2) {
        return { label: 'Fair', color: '#FF8C5A', width: '66%' };
    }

    return { label: 'Strong', color: '#51CF66', width: '100%' };
};

const Register = () => {
    const navigate = useNavigate();
    const { register, isLoggedIn, user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        studentId: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordStrength = useMemo(
        () => getPasswordStrength(formData.password),
        [formData.password]
    );

    useEffect(() => {
        if (isLoggedIn) {
            navigate(getDashboardPath(user?.role));
        }
    }, [isLoggedIn, navigate, user?.role]);

    const updateField = (field, value) => {
        setFormData((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: '' }));
        setFormError('');
    };

    const validate = () => {
        const nextErrors = {};

        if (!formData.name.trim()) {
            nextErrors.name = 'Please enter your full name.';
        }

        if (!formData.email.trim()) {
            nextErrors.email = 'University email is required.';
        } else if (!/.+@.+\.edu$/i.test(formData.email.trim())) {
            nextErrors.email = 'Please use a valid university email ending in .edu';
        }

        if (!formData.studentId.trim()) {
            nextErrors.studentId = 'Student ID is required.';
        }

        if (!formData.password) {
            nextErrors.password = 'Password is required.';
        } else if (formData.password.length < 8) {
            nextErrors.password = 'Password must be at least 8 characters long.';
        }

        if (!formData.confirmPassword) {
            nextErrors.confirmPassword = 'Please confirm your password.';
        } else if (formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);

        const result = await register({
            name: formData.name,
            email: formData.email,
            studentId: formData.studentId,
            password: formData.password,
        });

        if (!result.success) {
            setFormError(result.message);
            setLoading(false);
            return;
        }

        setTimeout(() => {
            navigate('/login', { state: { fromSignup: true } });
        }, 800);
    };

    const renderInput = ({
        field,
        label,
        placeholder,
        type = 'text',
        icon,
        toggle,
        delay,
    }) => {
        const hasError = Boolean(errors[field]);
        const isFocused = focusedField === field;

        return (
            <div
                style={{
                    opacity: 0,
                    animation: `fadeSlideUp 0.6s ease forwards`,
                    animationDelay: `${delay}ms`,
                }}
            >
                <label htmlFor={field} style={labelStyle}>{label}</label>
                <div style={fieldWrapperBase}>
                    <span
                        style={{
                            position: 'absolute',
                            left: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: isFocused ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                            transition: 'color 0.2s ease',
                            zIndex: 1,
                        }}
                    >
                        {icon}
                    </span>
                    <input
                        id={field}
                        type={type}
                        value={formData[field]}
                        placeholder={placeholder}
                        onChange={(event) => updateField(field, event.target.value)}
                        onFocus={() => setFocusedField(field)}
                        onBlur={() => setFocusedField('')}
                        style={getInputStyle(hasError)}
                    />
                    {toggle}
                </div>
                {errors[field] && <div style={inlineErrorStyle}>{errors[field]}</div>}
            </div>
        );
    };

    return (
        <div style={pageWrapStyle}>
            <div style={cardStyle}>
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
                        {'\u{1F393}'}
                    </div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '-1.4px' }}>
                        Create your account
                    </h1>
                    <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                        Join CampusFound and never lose anything again
                    </p>
                </div>

                {formError && (
                    <div
                        style={{
                            marginBottom: '18px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,107,107,0.28)',
                            background: 'rgba(255,107,107,0.08)',
                            color: '#FF9A9A',
                            padding: '12px 14px',
                            fontSize: '13px',
                        }}
                    >
                        {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
                    {renderInput({
                        field: 'name',
                        label: 'Full Name',
                        placeholder: 'Your full name',
                        icon: <User size={18} />,
                        delay: fieldAnimations[0],
                    })}

                    {renderInput({
                        field: 'email',
                        label: 'University Email',
                        placeholder: 'you@university.edu',
                        type: 'email',
                        icon: <Mail size={18} />,
                        delay: fieldAnimations[1],
                    })}

                    {renderInput({
                        field: 'studentId',
                        label: 'Student ID',
                        placeholder: 'e.g. IT21001234',
                        icon: <IdCard size={18} />,
                        delay: fieldAnimations[2],
                    })}

                    <div style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease forwards', animationDelay: '200ms' }}>
                        <div
                            style={{
                                borderRadius: '14px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.03)',
                                padding: '14px 16px',
                            }}
                        >
                            <div style={{ color: '#F8F9FA', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                                Account Type
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                                Normal User
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#FFB38F' }}>
                                Admin accounts are created only through secure seed data and are not available in public registration.
                            </div>
                        </div>
                    </div>

                    <div style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease forwards', animationDelay: `${fieldAnimations[3] + 80}ms` }}>
                        <label htmlFor="password" style={labelStyle}>Password</label>
                        <div style={fieldWrapperBase}>
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
                                placeholder="Min. 8 characters"
                                onChange={(event) => updateField('password', event.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('')}
                                style={getInputStyle(Boolean(errors.password))}
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
                        <div style={{ marginTop: '10px' }}>
                            <div
                                style={{
                                    width: '100%',
                                    height: '6px',
                                    borderRadius: '999px',
                                    background: 'rgba(255,255,255,0.08)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: passwordStrength.width,
                                        height: '100%',
                                        background: passwordStrength.color,
                                        borderRadius: '999px',
                                        transition: 'width 0.3s ease, background 0.3s ease',
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: passwordStrength.color || 'rgba(255,255,255,0.35)' }}>
                                {passwordStrength.label || 'Use at least 8 characters, a number, and a special character.'}
                            </div>
                        </div>
                        {errors.password && <div style={inlineErrorStyle}>{errors.password}</div>}
                    </div>

                    <div style={{ opacity: 0, animation: 'fadeSlideUp 0.6s ease forwards', animationDelay: `${fieldAnimations[4] + 80}ms` }}>
                        <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
                        <div style={fieldWrapperBase}>
                            <span
                                style={{
                                    position: 'absolute',
                                    left: '14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: focusedField === 'confirmPassword' ? '#FF6B35' : 'rgba(255,255,255,0.3)',
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
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                placeholder="Confirm your password"
                                onChange={(event) => updateField('confirmPassword', event.target.value)}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField('')}
                                style={getInputStyle(Boolean(errors.confirmPassword))}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((current) => !current)}
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
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <div style={inlineErrorStyle}>{errors.confirmPassword}</div>}
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
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p style={footerTextStyle}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#FF6B35', textDecoration: 'none', fontWeight: 600 }}>
                        {'Sign In \u2192'}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
