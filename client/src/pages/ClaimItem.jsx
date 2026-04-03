import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
    AlertCircle, 
    Camera, 
    CheckCircle2, 
    ChevronLeft, 
    FileText, 
    Info, 
    MapPin, 
    ShieldCheck, 
    UploadCloud 
} from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';
import confetti from 'canvas-confetti';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PHONE_NUMBER_REGEX = /^\d{10}$/;

const ClaimItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [item, setItem] = useState(null);
    const [loadingItem, setLoadingItem] = useState(true);
    
    const [phoneNumber, setPhoneNumber] = useState('');
    const [proofDescription, setProofDescription] = useState('');
    const [proofImage, setProofImage] = useState('');
    const [imageName, setImageName] = useState('');
    
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const loadItem = async () => {
            if (!import.meta.env.VITE_API_URL || !id) return;
            try {
                setLoadingItem(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/items/${id}`);
                if (!response.ok) throw new Error('Failed to load item');
                
                const data = await response.json();
                if (isMounted) {
                    setItem(data.item);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Could not find the item you're trying to claim.");
            } finally {
                if (isMounted) setLoadingItem(false);
            }
        };

        loadItem();
        return () => { isMounted = false; };
    }, [id]);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setProofImage('');
            setImageName('');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please choose a valid image file.');
            event.target.value = '';
            setProofImage('');
            setImageName('');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError('Image must be smaller than 5MB.');
            event.target.value = '';
            setProofImage('');
            setImageName('');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setError('');
            setImageName(file.name);
            setProofImage(reader.result);
        };
        reader.readAsDataURL(file);
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
                colors: ['#6C63FF', '#00D4AA', '#F8F9FA']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#6C63FF', '#00D4AA', '#F8F9FA']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const submitClaim = async () => {
        if (!PHONE_NUMBER_REGEX.test(phoneNumber)) {
            setPhoneError('Phone number must contain exactly 10 digits.');
            setError('');
            return;
        }

        if (!proofDescription.trim()) {
            setError('Please provide a description or proof details.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setPhoneError('');

        try {
            if (!user?.token) {
                throw new Error('Please log in to submit a claim.');
            }

            if (!item?._id || item.type !== 'found') {
                throw new Error('Claims can only be submitted for found item reports.');
            }

            await axios.post(`${import.meta.env.VITE_API_URL}/claims`, {
                itemId: item._id,
                phoneNumber,
                explanation: proofDescription.trim(),
                proofImage,
            }, {
                headers: { Authorization: `Bearer ${user.token}` },
            });

            setIsSuccess(true);
            triggerSuccessEffects();
            setTimeout(() => {
                navigate('/user/dashboard', {
                    state: {
                        refreshAt: Date.now(),
                        activeTab: 'my_claims',
                        successMessage: 'Claim submitted successfully.',
                    },
                });
            }, 900);
        } catch (submitError) {
            setError(submitError.response?.data?.message || submitError.message || `Failed to submit claim.`);
        } finally {
            setIsSubmitting(false);
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
                        className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 bg-brand-primary/20 text-brand-primary shadow-[0_0_30px_rgba(108,99,255,0.4)]"
                    >
                        <ShieldCheck size={48} />
                    </motion.div>
                    <h2 className="text-3xl font-display font-bold text-white mb-4">Claim Submitted!</h2>
                    <p className="text-text-muted mb-8 text-lg">
                        Your proof of ownership has been securely transmitted. You will be notified once reviewed.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link to="/user/dashboard" className="block w-full">
                            <Button className="w-full py-6 text-lg">Go to Dashboard</Button>
                        </Link>
                        <button
                            type="button"
                            onClick={() => navigate(`/items/${id}`)}
                            className="text-sm text-text-muted hover:text-white transition-colors"
                        >
                            Return to Item
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const imageUrl = item?.image?.url || item?.imageUrl;
    const finalImageUrl = imageUrl?.startsWith('/uploads') 
        ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${imageUrl}` 
        : imageUrl;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
            <Link to={`/items/${id}`} className="inline-flex items-center text-text-muted hover:text-white mb-8 transition-colors group font-medium">
                <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Item Detail
            </Link>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 sm:p-12 rounded-3xl border border-surface-glass-border shadow-2xl relative overflow-hidden"
            >
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

                <div className="mb-8 relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="w-full flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck size={32} className="text-brand-secondary" />
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                                Verify Ownership
                            </h1>
                        </div>
                        <p className="text-text-muted text-lg">
                            Please provide private details or a photo (e.g., receipt, IMEI, distinctive marks) to formally claim this item.
                        </p>
                    </div>

                    {/* Miniature Item preview */}
                    {item && !loadingItem && (
                        <div className="w-full sm:w-64 glass-panel bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                            {finalImageUrl ? (
                                <img src={finalImageUrl} alt={item.title} className="w-16 h-16 rounded-xl object-cover bg-black/50" />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-black/40 flex items-center justify-center border border-white/10 text-xl">📦</div>
                            )}
                            <div className="overflow-hidden">
                                <p className="text-xs text-brand-secondary font-bold uppercase tracking-wider mb-1">Claiming</p>
                                <p className="text-sm font-bold text-white truncate">{item.title}</p>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100 flex items-start gap-3 relative z-10">
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-tag-lost" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-8 relative z-10">
                    <div>
                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Info size={16} />
                            Phone Number <span className="text-brand-primary">*</span>
                        </label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength={10}
                            placeholder="Enter your 10-digit phone number"
                            value={phoneNumber}
                            onChange={(e) => {
                                const digitsOnlyValue = e.target.value.replace(/\D/g, '');
                                setPhoneNumber(digitsOnlyValue);
                                setPhoneError(
                                    digitsOnlyValue.length === 0 || PHONE_NUMBER_REGEX.test(digitsOnlyValue)
                                        ? ''
                                        : 'Phone number must contain exactly 10 digits.'
                                );
                            }}
                            className={cn(
                                'w-full bg-black/20 border rounded-2xl p-5 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-brand-secondary focus:shadow-[0_0_20px_rgba(0,212,170,0.15)] transition-all',
                                phoneError ? 'border-red-500/50' : 'border-surface-glass-border'
                            )}
                        />
                        {phoneError ? <p className="mt-2 text-sm text-red-300">{phoneError}</p> : null}
                    </div>

                    <div>
                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={16} /> 
                            Proof Description <span className="text-brand-primary">*</span>
                        </label>
                        <textarea
                            placeholder="Describe something only the owner would know (e.g. 'There is a scratch on the bottom left corner' or 'The desktop wallpaper is a cat')."
                            value={proofDescription}
                            onChange={(e) => setProofDescription(e.target.value)}
                            className="w-full bg-black/20 border border-surface-glass-border rounded-2xl p-5 min-h-[140px] resize-none text-white placeholder:text-text-muted/50 focus:outline-none focus:border-brand-secondary focus:shadow-[0_0_20px_rgba(0,212,170,0.15)] transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Camera size={16} /> 
                            Supporting Image (Optional)
                        </label>
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
                            className="w-full border-2 border-dashed border-surface-glass-border rounded-2xl p-8 hover:border-brand-secondary/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-black/10 hover:bg-black/20 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-brand-secondary/20 transition-colors text-text-muted group-hover:text-brand-secondary shadow-lg">
                                {proofImage ? <UploadCloud size={28} /> : <Camera size={28} />}
                            </div>
                            <h4 className="text-white font-medium mb-1 text-lg">
                                {imageName ? 'Change uploaded evidence' : 'Upload photo evidence'}
                            </h4>
                            <p className="text-sm text-text-muted max-w-sm mx-auto">
                                {imageName || 'Upload a receipt, a photo of you with the item, or a screenshot of the serial number (Max 5MB).'}
                            </p>
                        </button>

                        {proofImage && (
                            <div className="mt-6 space-y-3 relative group">
                                <img
                                    src={proofImage}
                                    alt="Proof"
                                    className="h-56 w-full rounded-2xl object-cover border border-brand-secondary/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProofImage('');
                                        setImageName('');
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="absolute top-2 right-2 px-4 py-2 bg-black/70 backdrop-blur-md rounded-xl text-sm font-bold text-white hover:bg-tag-lost/80 transition-colors"
                                >
                                    Remove Image
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-surface-glass-border flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                    <p className="text-xs text-text-muted max-w-sm">
                        By submitting this claim, you verify under penalty of platform ban that this item legally belongs to you.
                    </p>
                    <Button 
                        onClick={submitClaim} 
                        disabled={isSubmitting || loadingItem} 
                        className="w-full sm:w-auto min-w-[200px] h-14 text-lg font-bold shadow-[0_0_20px_rgba(108,99,255,0.3)] bg-brand-primary/90 hover:bg-brand-primary text-white"
                    >
                        {isSubmitting ? (
                            <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            'Submit Claim'
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default ClaimItem;
