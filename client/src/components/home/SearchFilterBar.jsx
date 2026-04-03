import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Mic, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

const CATEGORIES = ['All', 'Lost', 'Found', 'Electronics', 'Wallets', 'Keys'];

const SearchFilterBar = () => {
    const [isFocused, setIsFocused] = useState(false);
    const [activeTag, setActiveTag] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="w-full max-w-4xl mx-auto px-4 z-20 relative -mt-8 mb-16">
            <motion.div
                className={cn(
                    "glass-panel-heavy rounded-full p-2 flex items-center transition-all duration-300 relative z-20",
                    isFocused ? "shadow-[0_0_40px_rgba(108,99,255,0.2)] border-brand-primary/50" : "shadow-2xl"
                )}
                animate={{ width: isFocused ? '100%' : '90%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="p-3 pl-4 text-text-muted">
                    <Search size={22} className={isFocused ? "text-brand-primary" : ""} />
                </div>

                <input
                    type="text"
                    placeholder="Search for wallets, keys, electronics..."
                    className="flex-grow bg-transparent border-none outline-none text-white px-2 placeholder:text-text-muted/60 text-base sm:text-lg font-body"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                <div className="flex items-center gap-2 pr-1">
                    <button className="p-2 sm:p-3 text-text-muted hover:text-brand-secondary transition-colors rounded-full hover:bg-white/5">
                        <Mic size={20} />
                    </button>
                    <div className="w-px h-8 bg-surface-glass-border mx-1"></div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-2 sm:p-3 text-white bg-white/10 hover:bg-brand-primary transition-colors rounded-full flex items-center justify-center"
                    >
                        {showFilters ? <X size={20} /> : <Filter size={20} />}
                    </button>
                </div>
            </motion.div>

            {/* Expanded filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 10, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] glass-panel rounded-2xl p-4 sm:p-6 border border-surface-glass-border shadow-2xl z-10"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="text-xs uppercase tracking-wider text-text-muted font-bold block mb-2 sm:mb-3">Location</label>
                                <div className="flex items-center bg-black/30 rounded-xl p-3 border border-white/5 focus-within:border-brand-primary/50 transition-colors">
                                    <MapPin size={18} className="text-brand-primary mr-3" />
                                    <input type="text" placeholder="Select campus location..." className="bg-transparent border-none outline-none text-white text-sm w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-text-muted font-bold block mb-2 sm:mb-3">Date Range</label>
                                <div className="flex items-center bg-black/30 rounded-xl p-3 border border-white/5 focus-within:border-brand-secondary/50 transition-colors">
                                    <Calendar size={18} className="text-brand-secondary mr-3" />
                                    <input type="date" className="bg-transparent border-none outline-none text-white text-sm w-full [color-scheme:dark]" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>Cancel</Button>
                            <Button size="sm">Apply Filters</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8 px-2">
                {CATEGORIES.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => setActiveTag(tag)}
                        className={cn(
                            "px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border",
                            activeTag === tag
                                ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                : "bg-surface-glass text-text-muted border-surface-glass-border hover:border-white/30 hover:text-white"
                        )}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchFilterBar;
