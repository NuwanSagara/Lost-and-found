import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Camera, CheckCircle2, ChevronLeft, Moon, Sun, UploadCloud, UserCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { getAvatarUrl } from '../lib/userProfile';
import { THEME_OPTIONS } from '../lib/theme';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const THEME_CHOICES = [
    {
        value: THEME_OPTIONS.DARK,
        label: 'Dark Mode',
        description: 'Low-glare interface for dim environments.',
        icon: Moon,
    },
    {
        value: THEME_OPTIONS.LIGHT,
        label: 'Light Mode',
        description: 'Bright interface with softer panel contrast.',
        icon: Sun,
    },
];

const UserDetails = () => {
    const { user, updateCurrentUser, theme, setTheme } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [saving, setSaving] = useState(false);

    const currentAvatar = useMemo(
        () => previewUrl || getAvatarUrl(user?.avatar),
        [previewUrl, user?.avatar]
    );

    useEffect(() => () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    }, [previewUrl]);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        setStatus({ type: '', message: '' });

        if (!file) {
            setSelectedFile(null);
            setPreviewUrl('');
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setSelectedFile(null);
            setPreviewUrl('');
            setStatus({ type: 'error', message: 'Only JPG, JPEG, and PNG images are allowed.' });
            event.target.value = '';
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
            setSelectedFile(null);
            setPreviewUrl('');
            setStatus({ type: 'error', message: 'Profile image must be smaller than 2MB.' });
            event.target.value = '';
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!selectedFile || !user?.token) {
            setStatus({ type: 'error', message: 'Please choose an image before saving.' });
            return;
        }

        try {
            setSaving(true);
            setStatus({ type: '', message: '' });

            const payload = new FormData();
            payload.append('avatar', selectedFile);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me/avatar`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                body: payload,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile picture.');
            }

            updateCurrentUser({
                avatar: data.user?.avatar || '',
            });
            setSelectedFile(null);
            setPreviewUrl('');
            setStatus({ type: 'success', message: data.message || 'Profile picture updated successfully.' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Failed to update profile picture.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
            <Link to="/user/dashboard" className="inline-flex items-center text-text-muted hover:text-text-primary mb-6 transition-colors group">
                <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8">
                <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-surface-glass-border">
                    <div className="flex items-center gap-3 mb-6">
                        <UserCircle2 className="text-brand-primary" size={28} />
                        <div>
                            <h1 className="text-3xl font-display font-bold text-text-primary">User Details</h1>
                            <p className="text-text-muted mt-1">View your account details and keep your profile photo up to date.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-surface-glass-border bg-black/20 p-5">
                            <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2">Full Name</p>
                            <p className="text-text-primary text-lg font-semibold">{user?.name || 'Not available'}</p>
                        </div>
                        <div className="rounded-2xl border border-surface-glass-border bg-black/20 p-5">
                            <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2">Email</p>
                            <p className="text-text-primary text-lg font-semibold break-all">{user?.email || 'Not available'}</p>
                        </div>
                        <div className="rounded-2xl border border-surface-glass-border bg-black/20 p-5">
                            <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2">Role</p>
                            <p className="text-text-primary text-lg font-semibold capitalize">{user?.role || 'user'}</p>
                        </div>
                        <div className="rounded-2xl border border-surface-glass-border bg-black/20 p-5">
                            <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2">Profile Photo Rules</p>
                            <p className="text-text-primary text-sm">JPG, JPEG, PNG only. Maximum size: 2MB.</p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-surface-glass-border bg-black/20 p-5">
                        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                            <div>
                                <h2 className="text-xl font-display font-bold text-text-primary">App Theme</h2>
                                <p className="text-sm text-text-muted mt-1">
                                    Your preference is saved automatically and restored the next time you sign in.
                                </p>
                            </div>
                            <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">
                                {theme === THEME_OPTIONS.LIGHT ? 'Light' : 'Dark'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {THEME_CHOICES.map(({ value, label, description, icon: Icon }) => {
                                const active = theme === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setTheme(value)}
                                        className={`rounded-2xl border p-4 text-left transition-all ${active ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_20px_rgba(108,99,255,0.18)]' : 'border-surface-glass-border bg-white/5 hover:border-brand-primary/40 hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-brand-primary text-white' : 'bg-surface-glass text-text-primary'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-text-primary">{label}</p>
                                                <p className="text-sm text-text-muted mt-1">{description}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <aside className="glass-panel p-8 sm:p-10 rounded-3xl border border-surface-glass-border">
                    <h2 className="text-2xl font-display font-bold text-text-primary mb-6">Profile Picture</h2>

                    <div className="flex flex-col items-center text-center">
                        <img
                            src={currentAvatar}
                            alt="Profile preview"
                            className="w-40 h-40 rounded-full object-cover border-4 border-white/10 shadow-2xl"
                        />
                        <p className="text-sm text-text-muted mt-4">
                            {selectedFile ? `Selected: ${selectedFile.name}` : 'Upload a photo to personalize your dashboard.'}
                        </p>
                    </div>

                    <label className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-surface-glass-border bg-black/20 px-6 py-10 text-center cursor-pointer hover:border-brand-primary/50 transition-colors">
                        <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
                        <div className="w-14 h-14 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center mb-4">
                            {selectedFile ? <Camera size={26} /> : <UploadCloud size={26} />}
                        </div>
                        <p className="text-text-primary font-semibold">Choose a new profile picture</p>
                        <p className="text-text-muted text-sm mt-2">Preview appears instantly before you save.</p>
                    </label>

                    {status.message ? (
                        <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm flex items-start gap-3 ${status.type === 'success' ? 'border-tag-found/30 bg-tag-found/10 text-green-100' : 'border-red-500/30 bg-red-500/10 text-red-100'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 text-tag-found" /> : <AlertCircle size={18} className="mt-0.5 text-red-300" />}
                            <span>{status.message}</span>
                        </div>
                    ) : null}

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleSave} disabled={saving || !selectedFile} className="flex-1 h-12 rounded-xl">
                            {saving ? 'Saving...' : 'Save Profile Picture'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!selectedFile || saving}
                            onClick={() => {
                                setSelectedFile(null);
                                setPreviewUrl('');
                                setStatus({ type: '', message: '' });
                            }}
                            className="flex-1 h-12 rounded-xl"
                        >
                            Clear Selection
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default UserDetails;
