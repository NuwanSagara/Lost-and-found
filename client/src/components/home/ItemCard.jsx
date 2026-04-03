import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const ItemCard = ({ item, index = 0 }) => {
    const type = item.type || item.status;
    const isLost = type === 'lost';
    // Fallbacks for image url processing
    const imageUrl = item.image?.url
        ? item.image.url.startsWith('/uploads')
            ? `${(import.meta.env.VITE_API_URL || '').replace('/api', '')}${item.image.url}`
            : item.image.url
        : item.imageUrl;
        
    const locationLabel = item.location?.name || item.location || 'Unknown Location';
    const dateLabel = item.reportedAt || item.createdAt || item.date;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{ y: -8 }}
            className="group relative flex flex-col h-full rounded-2xl overflow-hidden glass-panel border border-surface-glass-border hover:border-brand-primary/50 hover:shadow-[0_0_30px_rgba(108,99,255,0.15)] transition-all duration-300"
        >
            {/* Image Container 16:9 */}
            <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center border-b border-white/5">
                        <Tag size={48} strokeWidth={1} className="text-white/10 mb-2" />
                        <span className="text-xs text-text-muted/50 font-mono tracking-widest">NO IMAGE</span>
                    </div>
                )}

                {/* Top Overlay Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center shadow-xl">
                        {item.category || 'Other'}
                    </div>
                </div>

                {/* Status Pill */}
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full font-bold text-[10px] tracking-widest uppercase shadow-xl backdrop-blur-md border ${
                    isLost ? 'bg-tag-lost/20 text-tag-lost border-tag-lost/30' : 'bg-tag-found/20 text-tag-found border-tag-found/30'
                }`}>
                    {type}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-transparent to-black/40">
                <Link to={`/items/${item._id || item.id || '1'}`} className="block focus:outline-none">
                    <h3 className="text-2xl font-display font-bold text-white mb-4 line-clamp-1 group-hover:text-brand-primary transition-colors">
                        {item.title}
                    </h3>
                </Link>

                <div className="space-y-3 mb-8 mt-auto">
                    <div className="flex items-center text-sm text-text-muted">
                        <MapPin size={16} className="mr-3 text-brand-secondary shrink-0" />
                        <span className="truncate">{locationLabel}</span>
                    </div>
                    <div className="flex items-center text-sm text-text-muted">
                        <Calendar size={16} className="mr-3 text-brand-secondary shrink-0" />
                        <span className="font-mono text-xs tracking-wide">
                            {dateLabel ? format(new Date(dateLabel), 'MMM dd, yyyy') : 'Unknown Date'}
                        </span>
                    </div>
                </div>

                <Link
                    to={`/items/${item._id || item.id || '1'}`}
                    className="w-full mt-auto flex items-center justify-between px-5 py-3.5 rounded-xl border border-surface-glass-border bg-white/5 hover:bg-brand-primary/10 hover:border-brand-primary/40 text-white font-medium transition-all group/btn"
                >
                    <span className="text-sm font-semibold tracking-wide">View Details</span>
                    <ArrowRight size={18} className="text-white/50 transition-all group-hover/btn:text-brand-primary group-hover/btn:translate-x-1" />
                </Link>
            </div>
        </motion.div>
    );
};

export default ItemCard;
