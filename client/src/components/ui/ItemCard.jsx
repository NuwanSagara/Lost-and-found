import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

const ItemCard = ({ item }) => {
    const isLost = (item.type || item.status) === 'lost';
    const isEmergency = item.urgency === 'Emergency';
    const isRecovered = item.status === 'recovered';
    
    // Determine styles based on state
    let StatusColor = 'text-tag-found';
    let StatusBg = 'bg-tag-found/10 border-tag-found/20';
    let StatusLabel = item.type || item.status;
    
    if (isRecovered) {
        StatusColor = 'text-green-400';
        StatusBg = 'bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
        StatusLabel = 'RECOVERED';
    } else if (isEmergency) {
        StatusColor = 'text-red-500 animate-pulse font-black tracking-widest';
        StatusBg = 'bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
        StatusLabel = 'EMERGENCY';
    } else if (isLost) {
        StatusColor = 'text-tag-lost';
        StatusBg = 'bg-tag-lost/10 border-tag-lost/20';
    }
    
    // Safely extract nested data
    const locationName = typeof item.location === 'object' ? item.location?.name : item.location;
    const imageUrl = item.image?.url || item.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1000';
    const dateVal = item.reportedAt || item.date;
    const cacheVersion = item.updatedAt || item.createdAt || dateVal || '';
    const uploadBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    const resolvedImageUrl = imageUrl.startsWith('/uploads')
        ? `${uploadBaseUrl}${imageUrl}${cacheVersion ? `?t=${encodeURIComponent(new Date(cacheVersion).getTime())}` : ''}`
        : imageUrl;

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className={`group relative flex flex-col glass-panel rounded-3xl overflow-hidden shadow-lg shadow-black/40 transition-all hover:shadow-brand-primary/20 hover:border-brand-primary/30 ${isEmergency ? 'border-red-500/30 shadow-[0_4px_30px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20' : ''}`}
        >
            {/* Status Pill */}
            <div className="absolute top-4 left-4 z-10">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${StatusColor} ${StatusBg}`}>
                    {StatusLabel}
                </div>
            </div>

            {/* Category / Type Badge */}
            <div className="absolute top-4 right-4 z-10">
                <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white text-xs">
                    🏷️
                </div>
            </div>

            {/* Image Container */}
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-white/5">
                <img
                    src={resolvedImageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-80" />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-grow p-6 pt-4 relative z-20 -mt-8">
                <h3 className="text-xl font-display font-bold text-white mb-3 line-clamp-1">{item.title}</h3>
                
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center text-sm text-text-muted">
                        <MapPin className="w-4 h-4 mr-2 text-brand-secondary" />
                        <span className="truncate">{locationName || 'Unknown location'}</span>
                    </div>
                    <div className="flex items-center text-sm text-text-muted">
                        <Calendar className="w-4 h-4 mr-2 text-brand-primary" />
                        <span>{dateVal ? new Date(dateVal).toLocaleDateString() : 'Unknown date'}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-text-muted">ID: {item._id?.substring(0,6) || item.id?.substring(0,6) || 'N/A'}</span>
                    <Link
                        to={`/items/${item._id || item.id}`}
                        className="flex items-center text-sm font-semibold text-white group-hover:text-brand-primary transition-colors"
                    >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default ItemCard;
