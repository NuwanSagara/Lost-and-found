import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Search as SearchIcon, Loader2 } from 'lucide-react';
import ItemCard from '../components/ui/ItemCard';
import SearchInput from '../components/ui/SearchInput';
import { Button } from '../components/ui/Button';

const Search = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ category: 'All', status: 'All' });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const LIMIT = 20;
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams();
                params.set('limit', LIMIT);
                params.set('page', page);
                params.set('sort', '-reportedAt');
                // No status filter when status === 'All' so all statuses are included
                if (filters.status !== 'All') params.set('status', filters.status.toLowerCase());
                if (filters.category !== 'All') params.set('category', filters.category);

                const res = await fetch(`${import.meta.env.VITE_API_URL}/items?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to load items');
                const data = await res.json();

                if (isMountedRef.current) {
                    const fetchedItems = Array.isArray(data.items) ? data.items : [];
                    setItems(page === 1 ? fetchedItems : prev => [...prev, ...fetchedItems]);
                    setHasMore(fetchedItems.length === LIMIT);
                }
            } catch (err) {
                if (isMountedRef.current) setError('Could not load items. Please try again.');
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };
        fetchItems();
    }, [filters.status, filters.category, page]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [filters.status, filters.category]);

    // Client-side search query filter (applied on top of already-fetched items)
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(item => {
            const titleMatch = item.title?.toLowerCase().includes(q);
            const descMatch = item.description?.toLowerCase().includes(q);
            const locationName = typeof item.location === 'object' ? item.location?.name : item.location;
            const locationMatch = locationName?.toLowerCase().includes(q);
            return titleMatch || descMatch || locationMatch;
        });
    }, [items, searchQuery]);

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-10 pt-28">
            <div className="max-w-[1440px] mx-auto flex flex-col items-center">

                {/* Animated Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10 w-full"
                >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 tracking-tight">
                        Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Discoveries.</span>
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto font-body">
                        Search through lost and found items in our secure community database.
                    </p>
                </motion.div>

                {/* Search + Filters */}
                <div className="w-full mb-16 relative z-30">
                    <SearchInput
                        onSearch={setSearchQuery}
                        filters={filters}
                        setFilters={setFilters}
                    />
                </div>

                {/* Results */}
                <div className="w-full flex-1 z-10">
                    <div className="mb-6 flex items-center justify-between text-text-muted text-sm border-b border-white/10 pb-4">
                        <span className="font-mono text-xs uppercase tracking-widest">
                            Showing <strong className="text-white mx-1">{filteredItems.length}</strong> results
                        </span>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                            <LayoutGrid size={16} className="text-brand-primary" />
                            <span className="font-medium">Grid</span>
                        </div>
                    </div>

                    {loading && page === 1 ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 size={40} className="animate-spin text-brand-primary" />
                        </div>
                    ) : error ? (
                        <div className="col-span-full py-24 text-center glass-panel rounded-3xl border border-red-500/20">
                            <p className="text-red-400 text-lg">{error}</p>
                            <Button variant="outline" className="mt-6" onClick={() => { setPage(1); setError(''); }}>Retry</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 auto-rows-[380px]">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item._id || item.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-50px' }}
                                        transition={{ duration: 0.5, delay: (index % 8) * 0.05, ease: 'easeOut' }}
                                        className="h-full"
                                    >
                                        <ItemCard item={item} />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center glass-panel rounded-3xl border border-white/5">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative flex items-center justify-center mb-6"
                                    >
                                        <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full"></div>
                                        <SearchIcon size={80} className="text-white/20 relative z-10" strokeWidth={1} />
                                    </motion.div>
                                    <h3 className="text-3xl font-display font-medium text-white mb-3 tracking-tight">Nothing found.</h3>
                                    <p className="text-text-muted max-w-md font-body text-lg">
                                        {searchQuery ? 'No items match your search. Try different keywords.' : 'No items have been reported yet. Be the first!'}
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-8 px-8"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setFilters({ category: 'All', status: 'All' });
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && !loading && filteredItems.length > 0 && (
                        <div className="mt-20 flex justify-center">
                            <Button
                                variant="ghost"
                                className="px-8 rounded-full border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all font-medium py-3 h-auto"
                                onClick={() => setPage(p => p + 1)}
                                disabled={loading}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-full w-full bg-brand-secondary"></span>
                                    </span>
                                    Load more
                                </div>
                            </Button>
                        </div>
                    )}
                    {loading && page > 1 && (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 size={24} className="animate-spin text-brand-primary" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;
