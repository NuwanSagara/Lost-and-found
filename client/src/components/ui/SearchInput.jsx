import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, MapPin, Calendar, X } from 'lucide-react';

const SearchInput = ({ onSearch, filters, setFilters }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const CATEGORY_TAGS = ['All', 'Electronics', 'Wallets', 'Pets', 'Keys', 'Documents', 'Other'];
    const STATUS_TAGS = ['All', 'Lost', 'Found'];

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (onSearch) onSearch(searchValue);
    };

    return (
        <div className="w-full max-w-4xl mx-auto relative z-30">
            {/* Main Pill Search Bar */}
            <motion.form 
                onSubmit={handleSearchSubmit}
                className={`relative flex items-center bg-surface-glass backdrop-blur-2xl border transition-all duration-300 ${isExpanded ? 'border-brand-primary shadow-[0_0_30px_rgba(108,99,255,0.2)] rounded-t-3xl rounded-b-none' : 'border-surface-glass-border hover:border-white/20 rounded-full'}`}
                animate={{ width: isExpanded ? '100%' : '95%' }}
                initial={{ width: '95%' }}
                style={{ margin: '0 auto' }}
            >
                <div className="pl-6 pr-3 py-4 flex items-center justify-center text-text-muted">
                    <Search className="w-6 h-6" />
                </div>
                
                <input 
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    placeholder="Search for lost keys, iPhone 15, black wallet..."
                    className="flex-grow bg-transparent border-none outline-none text-white text-lg placeholder:text-text-muted/60 py-4 font-body"
                />

                <div className="px-4 flex items-center gap-2 border-l border-white/10 h-10">
                    <button type="button" className="p-2 text-text-muted hover:text-white transition-colors" title="Voice Search">
                        <Mic className="w-5 h-5" />
                    </button>
                    {isExpanded && (
                        <button type="button" onClick={() => setIsExpanded(false)} className="p-2 text-text-muted hover:text-white transition-colors" title="Close Filters">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </motion.form>

            {/* Expandable Filter Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scaleY: 0.95, y: -10 }}
                        animate={{ opacity: 1, scaleY: 1, y: 0 }}
                        exit={{ opacity: 0, scaleY: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 bg-bg-dark/95 backdrop-blur-3xl border border-t-0 border-brand-primary/50 rounded-b-3xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-6 origin-top flex flex-col gap-6"
                    >
                        {/* Status Filters */}
                        <div>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block">Status</span>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setFilters({ ...filters, status: tag })}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filters?.status === tag ? 'bg-brand-primary text-white border border-brand-primary' : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block">Categories</span>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setFilters({ ...filters, category: tag })}
                                        className={`px-4 py-1.5 rounded-full text-sm md:text-base transition-all ${filters?.category === tag ? 'bg-white text-black font-semibold' : 'bg-transparent text-text-muted border border-white/10 hover:border-white/30 hover:text-white'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <button className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left group">
                                <div className="flex items-center">
                                    <MapPin className="w-5 h-5 mr-3 text-brand-secondary group-hover:text-brand-secondary" />
                                    <div>
                                        <div className="text-xs text-text-muted leading-none mb-1">Location</div>
                                        <div className="text-sm text-white font-medium">Anywhere on Campus</div>
                                    </div>
                                </div>
                            </button>
                            <button className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left group">
                                <div className="flex items-center">
                                    <Calendar className="w-5 h-5 mr-3 text-brand-primary group-hover:text-brand-primary" />
                                    <div>
                                        <div className="text-xs text-text-muted leading-none mb-1">Date Range</div>
                                        <div className="text-sm text-white font-medium">Last 30 Days</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchInput;
