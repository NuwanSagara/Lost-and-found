import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath, normalizeRole, roleLabelMap, USER_ROLES } from '../lib/authRoles';
import { getAvatarUrl } from '../lib/userProfile';

const NavLink = ({ to, children, isActive }) => (
    <Link to={to} className="relative group px-1 py-2 text-sm font-medium text-text-primary transition-colors hover:text-text-primary">
        {children}
        <motion.span
            className="absolute bottom-0 left-0 h-0.5 bg-brand-secondary"
            initial={{ width: isActive ? '100%' : '0%' }}
            animate={{ width: isActive ? '100%' : '0%' }}
            whileHover={{ width: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
    </Link>
);

const Navbar = () => {
    const { user, isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const normalizedRole = normalizeRole(user?.role);
    const dashboardPath = getDashboardPath(normalizedRole);
    const avatarUrl = getAvatarUrl(user?.avatar);

    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/register';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    return (
        <motion.header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-bg-dark/70 backdrop-blur-xl border-b border-surface-glass-border shadow-lg shadow-black/20' : 'bg-transparent border-b border-transparent'} `}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
                
                {/* Logo Area */}
                <Link to="/" className="flex items-center gap-3 relative mr-8">
                    <div className="relative flex items-center justify-center w-3 h-3">
                        <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-tag-found"></span>
                        <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-tag-found"></span>
                    </div>
                    <span className="font-display font-bold text-2xl tracking-tighter text-text-primary">
                        Campus<span className="text-brand-primary">Found</span>
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <nav className="hidden md:flex items-center gap-8 ml-auto mr-8">
                    <NavLink to="/" isActive={location.pathname === '/'}>Home</NavLink>
                    <NavLink to="/items" isActive={location.pathname === '/items' || location.pathname.startsWith('/search')}>Browse Items</NavLink>
                    <NavLink to="/about" isActive={location.pathname === '/about'}>Mission Stats</NavLink>
                </nav>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {isLoggedIn ? (
                        <>
                            <img
                                src={avatarUrl}
                                alt={`${user?.name || 'User'} avatar`}
                                className="w-11 h-11 rounded-full object-cover border border-white/10"
                            />
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-sm font-medium text-text-primary">{user?.name}</span>
                                <span className="text-xs text-brand-secondary tracking-widest uppercase font-mono">
                                    {normalizedRole ? roleLabelMap[normalizedRole] || normalizedRole : 'Member'}
                                </span>
                            </div>

                            <Link to={dashboardPath} className="px-5 py-2 rounded-full border border-surface-glass-border bg-surface-glass backdrop-blur-md text-sm font-semibold text-text-primary transition-all hover:bg-white/10 hover:border-white/20">
                                Dashboard
                            </Link>
                            
                            {normalizedRole === USER_ROLES.ADMIN && (
                                <Link to="/admin" className="px-5 py-2 rounded-full border border-surface-glass-border bg-surface-glass backdrop-blur-md text-sm font-semibold text-text-primary transition-all hover:bg-white/10 hover:border-white/20">
                                    Admin
                                </Link>
                            )}
                            
                            <button
                                onClick={handleSignOut}
                                className="relative px-6 py-2 rounded-full font-bold text-sm text-white overflow-hidden group transition-all"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-tag-lost to-brand-primary opacity-80 group-hover:opacity-100 transition-opacity"></span>
                                <span className="relative">Sign Out</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className={`relative px-6 py-2 rounded-full font-bold text-sm text-white overflow-hidden group transition-all border border-brand-primary/50 shadow-[0_0_15px_rgba(108,99,255,0.3)] hover:shadow-[0_0_25px_rgba(108,99,255,0.6)]`}
                            >
                                <span className="absolute inset-0 w-full h-full bg-brand-primary/10 group-hover:bg-brand-primary/20 transition-colors"></span>
                                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-brand-primary to-brand-secondary"></span>
                                <span className="relative">Report Item</span>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className="md:hidden text-text-primary p-2 focus:outline-none"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        className="md:hidden absolute top-full left-0 w-full bg-bg-dark/95 backdrop-blur-2xl border-b border-surface-glass-border"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="flex flex-col p-6 gap-4">
                            <Link to="/" className="text-text-primary font-medium py-2 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                            <Link to="/items" className="text-text-primary font-medium py-2 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Browse Items</Link>
                            <Link to="/about" className="text-text-primary font-medium py-2 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Mission Stats</Link>
                            
                            {isLoggedIn ? (
                                <>
                                    <Link to={dashboardPath} className="text-brand-secondary font-medium py-2 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                                    <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="text-left py-2 font-medium text-tag-lost mt-2">Sign Out</button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 mt-4">
                                    <Link to="/login" className="w-full text-center py-3 rounded-xl border border-surface-glass-border text-text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                                    <Link to="/signup" className="w-full text-center py-3 rounded-xl bg-brand-primary text-white font-bold" onClick={() => setMobileMenuOpen(false)}>Create Account</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

export default Navbar;
