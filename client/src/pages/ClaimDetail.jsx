import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    AlertCircle,
    Calendar,
    ChevronLeft,
    FileText,
    Image as ImageIcon,
    MapPin,
    Pencil,
    Phone,
    Save,
    ShieldCheck,
    Trash2,
    UploadCloud,
    X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PHONE_NUMBER_REGEX = /^\d{10}$/;

const formatStatusLabel = (value) =>
    String(value || 'pending')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const ClaimDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [formData, setFormData] = useState({
        phoneNumber: '',
        explanation: '',
        proofImage: '',
    });
    const [imageName, setImageName] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadClaim = async () => {
            if (!user?.token || !id) {
                return;
            }

            try {
                setLoading(true);
                setError('');
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/claims/${id}`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                if (!isMounted) {
                    return;
                }

                const nextClaim = response.data;
                setClaim(nextClaim);
                setFormData({
                    phoneNumber: nextClaim.phoneNumber || '',
                    explanation: nextClaim.explanation || '',
                    proofImage: nextClaim.proofImage || '',
                });
                setImageName(nextClaim.proofImage ? 'Current supporting evidence' : '');
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError.response?.data?.message || loadError.message || 'Failed to load claim details.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadClaim();

        return () => {
            isMounted = false;
        };
    }, [id, user?.token]);

    const relatedItem = claim?.itemId;
    const itemImageUrl = relatedItem?.image?.url?.startsWith('/uploads')
        ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${relatedItem.image.url}`
        : relatedItem?.image?.url;

    const proofImageUrl = formData.proofImage?.startsWith('/uploads')
        ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${formData.proofImage}`
        : formData.proofImage;

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please choose a valid image file.');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError('Image must be smaller than 5MB.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setError('');
            setImageName(file.name);
            setFormData((current) => ({
                ...current,
                proofImage: reader.result,
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!PHONE_NUMBER_REGEX.test(formData.phoneNumber)) {
            setPhoneError('Phone number must contain exactly 10 digits.');
            return;
        }

        if (!formData.explanation.trim()) {
            setError('Please provide a proof description.');
            return;
        }

        try {
            setIsSaving(true);
            setError('');
            setPhoneError('');

            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/claims/${id}`,
                {
                    phoneNumber: formData.phoneNumber,
                    explanation: formData.explanation.trim(),
                    proofImage: formData.proofImage,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );

            setClaim(response.data);
            setFormData({
                phoneNumber: response.data.phoneNumber || '',
                explanation: response.data.explanation || '',
                proofImage: response.data.proofImage || '',
            });
            setImageName(response.data.proofImage ? 'Current supporting evidence' : '');
            setIsEditing(false);
        } catch (saveError) {
            setError(saveError.response?.data?.message || saveError.message || 'Failed to update claim.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this claim report?')) {
            return;
        }

        try {
            setIsDeleting(true);
            setError('');

            await axios.delete(`${import.meta.env.VITE_API_URL}/claims/${id}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });

            navigate('/user/dashboard', {
                state: {
                    refreshAt: Date.now(),
                    activeTab: 'my_claims',
                    successMessage: 'Claim report deleted successfully.',
                },
            });
        } catch (deleteError) {
            setError(deleteError.response?.data?.message || deleteError.message || 'Failed to delete claim.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
                <div className="glass-panel rounded-3xl border border-surface-glass-border p-8 text-text-muted">
                    Loading claim details...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
            <Link to="/user/dashboard" className="inline-flex items-center text-text-muted hover:text-white mb-8 transition-colors group font-medium">
                <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            {error ? (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100 flex items-start gap-3">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-tag-lost" />
                    <span>{error}</span>
                </div>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="xl:col-span-8 glass-panel rounded-3xl border border-surface-glass-border p-8 sm:p-10"
                >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-brand-secondary/30 bg-brand-secondary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-secondary mb-4">
                                <ShieldCheck size={14} />
                                Claim Report
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">
                                {relatedItem?.title || 'Claim Details'}
                            </h1>
                            <p className="text-text-muted mt-3 max-w-2xl">
                                Review the full ownership claim, supporting evidence, and the linked found-item report from one place.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <span className="inline-flex items-center rounded-full border border-brand-primary/30 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary">
                                {formatStatusLabel(claim?.status)}
                            </span>
                            {isEditing ? (
                                <>
                                    <Button variant="outline" onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            phoneNumber: claim?.phoneNumber || '',
                                            explanation: claim?.explanation || '',
                                            proofImage: claim?.proofImage || '',
                                        });
                                        setPhoneError('');
                                        setError('');
                                    }}>
                                        <X size={16} className="mr-2" />
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        <Save size={16} className="mr-2" />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                                        <Pencil size={16} className="mr-2" />
                                        Edit
                                    </Button>
                                    <Button variant="outline" onClick={handleDelete} disabled={isDeleting} className="border-red-500/40 text-red-300 hover:bg-red-500/10">
                                        <Trash2 size={16} className="mr-2" />
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="rounded-2xl border border-surface-glass-border bg-black/20 p-5">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                                <Calendar size={14} />
                                Submitted
                            </div>
                            <p className="text-white font-medium">
                                {claim?.createdAt ? new Date(claim.createdAt).toLocaleString() : 'Unknown'}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-surface-glass-border bg-black/20 p-5">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                                <Phone size={14} />
                                Contact Number
                            </div>
                            {isEditing ? (
                                <>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        value={formData.phoneNumber}
                                        onChange={(event) => {
                                            const digitsOnly = event.target.value.replace(/\D/g, '');
                                            setFormData((current) => ({ ...current, phoneNumber: digitsOnly }));
                                            setPhoneError(
                                                digitsOnly.length === 0 || PHONE_NUMBER_REGEX.test(digitsOnly)
                                                    ? ''
                                                    : 'Phone number must contain exactly 10 digits.'
                                            );
                                        }}
                                        className={cn(
                                            'w-full rounded-xl border bg-black/20 px-4 py-3 text-white focus:outline-none focus:border-brand-secondary',
                                            phoneError ? 'border-red-500/50' : 'border-surface-glass-border'
                                        )}
                                    />
                                    {phoneError ? <p className="mt-2 text-sm text-red-300">{phoneError}</p> : null}
                                </>
                            ) : (
                                <p className="text-white font-medium">{claim?.phoneNumber || 'Not provided'}</p>
                            )}
                        </div>
                        <div className="rounded-2xl border border-surface-glass-border bg-black/20 p-5">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                                <MapPin size={14} />
                                Related Item
                            </div>
                            <p className="text-white font-medium">{relatedItem?.location?.name || 'Unknown location'}</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-surface-glass-border bg-black/20 p-6 sm:p-7 mb-8">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted mb-4">
                            <FileText size={16} />
                            Proof Description
                        </div>
                        {isEditing ? (
                            <textarea
                                value={formData.explanation}
                                onChange={(event) => setFormData((current) => ({ ...current, explanation: event.target.value }))}
                                className="w-full min-h-[180px] rounded-2xl border border-surface-glass-border bg-black/20 p-5 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-brand-secondary"
                                placeholder="Describe your proof of ownership..."
                            />
                        ) : (
                            <p className="text-white/90 leading-8 whitespace-pre-wrap">{claim?.explanation || 'No description provided.'}</p>
                        )}
                    </div>

                    <div className="rounded-3xl border border-surface-glass-border bg-black/20 p-6 sm:p-7">
                        <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
                                <ImageIcon size={16} />
                                Supporting Evidence
                            </div>
                            {isEditing ? (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <UploadCloud size={16} className="mr-2" />
                                        {imageName ? 'Change Evidence' : 'Upload Evidence'}
                                    </Button>
                                </>
                            ) : null}
                        </div>

                        {proofImageUrl ? (
                            <div className="space-y-4">
                                <img
                                    src={proofImageUrl}
                                    alt="Supporting evidence"
                                    className="w-full max-h-[420px] rounded-2xl object-cover border border-surface-glass-border"
                                />
                                {isEditing ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData((current) => ({ ...current, proofImage: '' }));
                                            setImageName('');
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        className="text-sm text-text-muted hover:text-white transition-colors"
                                    >
                                        Remove supporting evidence
                                    </button>
                                ) : null}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-surface-glass-border px-6 py-12 text-center text-text-muted">
                                No supporting evidence uploaded.
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="xl:col-span-4 space-y-6"
                >
                    <div className="glass-panel rounded-3xl border border-surface-glass-border overflow-hidden">
                        <div className="aspect-[4/3] bg-black/20 overflow-hidden">
                            {itemImageUrl ? (
                                <img src={itemImageUrl} alt={relatedItem?.title || 'Related item'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-muted">
                                    <ShieldCheck size={28} />
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <p className="text-xs uppercase tracking-wider text-brand-secondary font-bold mb-2">Related Found Report</p>
                            <h2 className="text-2xl font-display font-bold text-white mb-3">{relatedItem?.title || 'Found Item'}</h2>
                            <p className="text-text-muted line-clamp-4 mb-5">{relatedItem?.description || 'No related item description available.'}</p>
                            <div className="space-y-3 text-sm text-text-muted mb-6">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-brand-primary" />
                                    <span>{relatedItem?.location?.name || 'Unknown location'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-brand-secondary" />
                                    <span>{relatedItem?.reportedAt ? new Date(relatedItem.reportedAt).toLocaleDateString() : 'Unknown date'}</span>
                                </div>
                            </div>
                            <Link to={`/items/${relatedItem?._id || relatedItem?.id || claim?.itemId}`} className="block">
                                <Button variant="outline" className="w-full">View Related Item</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="glass-panel rounded-3xl border border-surface-glass-border p-6">
                        <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-4">Claim Summary</p>
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-text-muted mb-1">Status</p>
                                <p className="text-white font-medium">{formatStatusLabel(claim?.status)}</p>
                            </div>
                            <div>
                                <p className="text-text-muted mb-1">Submitted By</p>
                                <p className="text-white font-medium">{claim?.claimant?.name || user?.name || 'You'}</p>
                            </div>
                            <div>
                                <p className="text-text-muted mb-1">Reference ID</p>
                                <p className="text-white font-medium font-mono">{claim?._id}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ClaimDetail;
