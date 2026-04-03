import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOCK_ITEMS } from '../lib/mockData';
import { Button } from '../components/ui/Button';
import MatchCard from '../components/MatchCard';
import { MapPin, Calendar, Share2, AlertCircle, CheckCircle2, ChevronLeft, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const getLocationCoordinates = (entry) => {
    const coords = entry?.location?.coordinates?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
        return null;
    }

    const [lng, lat] = coords;
    if (typeof lat !== 'number' || typeof lng !== 'number' || (lat === 0 && lng === 0)) {
        return null;
    }

    return { lat, lng };
};

const getLocationLabel = (entry) => {
    const name = entry?.location?.name?.trim();
    if (name && name !== 'Current device location') {
        return name;
    }

    const coordinates = getLocationCoordinates(entry);
    if (coordinates) {
        return `Reported coordinates (${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)})`;
    }

    return 'Unknown location';
};

const ItemDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const [formFocused, setFormFocused] = useState('');
    const [matches, setMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [itemRecord, setItemRecord] = useState(null);
    const [loadingItem, setLoadingItem] = useState(false);

    const fallbackItem = useMemo(() => MOCK_ITEMS.find((entry) => entry.id === id) || MOCK_ITEMS[0], [id]);
    const item = itemRecord || {
        _id: fallbackItem.id,
        type: fallbackItem.status === 'found' ? 'found' : 'lost',
        status: fallbackItem.status,
        title: fallbackItem.title,
        description: fallbackItem.description,
        category: fallbackItem.category,
        location: { name: fallbackItem.location },
        image: { url: fallbackItem.imageUrl },
        reportedAt: fallbackItem.date,
    };
    const isLost = item.type === 'lost';
    const isFound = item.type === 'found';
    const locationLabel = getLocationLabel(item);
    const itemCoordinates = getLocationCoordinates(item);
    const mapQuery = itemCoordinates
        ? `${itemCoordinates.lat},${itemCoordinates.lng}`
        : locationLabel;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadItem = async () => {
            if (!import.meta.env.VITE_API_URL || !id) {
                return;
            }

            try {
                setLoadingItem(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/items/${id}`);
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                if (isMounted) {
                    setItemRecord(data.item || null);
                }
            } catch (error) {
                console.error('Failed to load item details', error);
            } finally {
                if (isMounted) {
                    setLoadingItem(false);
                }
            }
        };

        loadItem();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        let isMounted = true;

        const loadMatches = async () => {
            if (!import.meta.env.VITE_API_URL || !id || !user?.token) {
                return;
            }

            try {
                setLoadingMatches(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/items/${id}/matches`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                if (isMounted) {
                    setMatches(Array.isArray(data.matches) ? data.matches : []);
                }
            } catch (error) {
                console.error('Failed to load match results', error);
            } finally {
                if (isMounted) {
                    setLoadingMatches(false);
                }
            }
        };

        loadMatches();

        return () => {
            isMounted = false;
        };
    }, [id, user?.token]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const imageSrc = item.image?.url?.startsWith('/uploads')
        ? `${(import.meta.env.VITE_API_URL || '').replace('/api', '')}${item.image.url}`
        : item.image?.url;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
            <Link to="/search" className="inline-flex items-center text-text-muted hover:text-white mb-6 transition-colors group">
                <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Browse
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                <div className="w-full lg:w-3/5 space-y-6">
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full aspect-video md:aspect-[4/3] rounded-3xl overflow-hidden glass-panel border border-surface-glass-border shadow-2xl relative">
                        {imageSrc ? <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" /> : null}
                        <div className={cn('absolute top-6 left-6 px-4 py-2 rounded-full font-bold text-xs tracking-widest uppercase shadow-2xl border backdrop-blur-md flex items-center gap-2', isLost ? 'bg-tag-lost/80 text-white border-tag-lost' : 'bg-tag-found/80 text-white border-tag-found')}>
                            {isLost ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                            {item.type}
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-panel p-6 rounded-3xl border border-surface-glass-border">
                            <h3 className="text-xl font-display font-bold text-white mb-6">Location History</h3>
                            <div className="w-full h-48 bg-[#1a1a24] rounded-2xl overflow-hidden relative border border-white/5">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) opacity(0.8)' }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Location Map"
                                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(mapQuery || 'College Campus')}`}
                                ></iframe>
                                {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a24]/80 backdrop-blur-sm pointer-events-none">
                                        <MapPin size={32} className="text-brand-primary" />
                                        <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white mt-2 border border-white/20">
                                            {locationLabel}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl border border-surface-glass-border">
                            <h3 className="text-xl font-display font-bold text-white mb-6">Timeline</h3>
                            <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-surface-glass-border">
                                <div className="relative">
                                    <div className="absolute -left-[30px] w-3 h-3 rounded-full bg-brand-primary ring-4 ring-brand-primary/20 mt-1"></div>
                                    <p className="text-sm font-bold text-white mb-1">Report Submitted</p>
                                    <p className="text-xs text-text-muted font-mono">{format(new Date(item.reportedAt), 'MMM dd, yyyy - hh:mm a')}</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[30px] w-3 h-3 rounded-full bg-surface-glass-border mt-1"></div>
                                    <p className="text-sm font-bold text-white mb-1">Current Status</p>
                                    <p className="text-xs text-text-muted capitalize">{item.status}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-2/5 flex flex-col">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-8 rounded-3xl border border-surface-glass-border sticky top-28 flex flex-col flex-grow bg-gradient-to-br from-white/[0.05] to-transparent">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="px-3 py-1 rounded-full glass-panel-heavy backdrop-blur-md border border-white/10 text-xs font-medium text-white inline-block mb-4 shadow-lg">
                                    {item.category || 'Other'}
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">{item.title}</h1>
                            </div>

                            <Button variant="glass" size="icon" onClick={handleShare} className="rounded-full flex-shrink-0" title="Copy Link">
                                {copied ? <CheckCircle2 size={18} className="text-tag-found" /> : <Share2 size={18} />}
                            </Button>
                        </div>

                        <div className="space-y-4 mb-8 text-text-muted">
                            <div className="flex items-start">
                                <MapPin size={20} className="mr-3 text-brand-primary shrink-0 mt-0.5" />
                                <span className="text-white font-medium">{locationLabel}</span>
                            </div>
                            <div className="flex items-center">
                                <Calendar size={20} className="mr-3 text-brand-secondary shrink-0" />
                                <span className="font-mono">{format(new Date(item.reportedAt), 'MMMM dd, yyyy')}</span>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-sm uppercase tracking-wider text-text-muted font-bold mb-3">Description</h3>
                            <p className="text-md leading-relaxed text-gray-300">{item.description || 'No additional description provided.'}</p>
                        </div>

                        {isFound ? (
                            <div className="mt-auto border-t border-surface-glass-border pt-8">
                                <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                                    <MessageSquare size={20} className="text-brand-secondary" />
                                    This is mine
                                </h3>

                                <div className="space-y-4">
                                    <div className={cn('relative rounded-xl border transition-all duration-300 bg-black/20', formFocused === 'message' ? 'border-brand-primary shadow-[0_0_15px_rgba(108,99,255,0.2)]' : 'border-surface-glass-border hover:border-white/20')}>
                                        <textarea
                                            placeholder="Send a secure message to coordinate..."
                                            className="w-full bg-transparent border-none outline-none text-white p-4 min-h-[120px] resize-none text-sm placeholder:text-text-muted/50"
                                            onFocus={() => setFormFocused('message')}
                                            onBlur={() => setFormFocused('')}
                                        ></textarea>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button className="flex-1 h-12 rounded-xl text-base shadow-lg shadow-brand-primary/20 font-bold">Send Message</Button>
                                        <Link to={`/claim/${item._id || item.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full h-12 rounded-xl text-base font-bold bg-white/5 border-brand-secondary/50 text-brand-secondary hover:bg-brand-secondary/10">
                                                Claim Ownership
                                            </Button>
                                        </Link>
                                    </div>
                                    <p className="text-xs text-center text-text-muted mt-4">For formal claims, submitting proof of ownership is required.</p>
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                </div>
            </div>

            <section className="mt-12">
                <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white tracking-tight">AI Match Results</h2>
                        <p className="text-text-muted mt-2">Ranked candidates based on semantic text, image, and metadata similarity.</p>
                    </div>
                    {loadingMatches || loadingItem ? (
                        <span className="text-sm text-text-muted">Loading matches...</span>
                    ) : (
                        <span className="text-sm text-text-muted">{matches.length} result{matches.length === 1 ? '' : 's'}</span>
                    )}
                </div>

                {matches.length > 0 ? (
                    <div className="grid gap-6">
                        {matches.map((match) => (
                            <MatchCard
                                key={match._id}
                                match={match}
                                itemType={item.type}
                                onStatusChange={(matchId, status) => {
                                    setMatches((current) => current.map((entry) => (entry._id === matchId ? { ...entry, status } : entry)));
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel p-8 rounded-3xl border border-surface-glass-border text-center">
                        <h3 className="text-xl font-display font-bold text-white mb-2">No AI matches yet</h3>
                        <p className="text-text-muted max-w-2xl mx-auto">
                            {user?.token
                                ? 'Once an opposite-type report is available, ranked suggestions will appear here automatically.'
                                : 'Log in to view and act on protected AI match results for this item.'}
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ItemDetail;
