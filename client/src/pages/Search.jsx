import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search as SearchIcon, Filter, MapPin, Calendar, Tag, ChevronDown, PackageOpen } from 'lucide-react';
import { format } from 'date-fns';
import ClaimModal from '../components/ClaimModal';

const Search = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchParams, setSearchParams] = useState({
        query: '',
        type: 'all', // all, lost, found
        category: 'all',
    });

    // Real implementation would fetch based on searchParams
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const [lostRes, foundRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/lost`),
                    axios.get(`${import.meta.env.VITE_API_URL}/found`)
                ]);

                let allItems = [
                    ...lostRes.data.map(i => ({ ...i, itemType: 'lost' })),
                    ...foundRes.data.map(i => ({ ...i, itemType: 'found' }))
                ];

                // Sort by newest
                allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setItems(allItems);
            } catch (error) {
                console.error("Error fetching items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    const filteredItems = items.filter(item => {
        // Text search
        const matchesQuery = searchParams.query === '' ||
            item.title.toLowerCase().includes(searchParams.query.toLowerCase()) ||
            item.description.toLowerCase().includes(searchParams.query.toLowerCase());

        // Type filter
        const matchesType = searchParams.type === 'all' || item.itemType === searchParams.type;

        // Category filter
        const matchesCategory = searchParams.category === 'all' || item.category === searchParams.category;

        return matchesQuery && matchesType && matchesCategory;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header and Search Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-1/2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Search for keys, wallet, phone..."
                        value={searchParams.query}
                        onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                    />
                </div>

                <div className="w-full md:w-auto flex gap-3">
                    <div className="relative">
                        <select
                            className="appearance-none block w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchParams.type}
                            onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                        >
                            <option value="all">All Items</option>
                            <option value="lost">Lost Items</option>
                            <option value="found">Found Items</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none block w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchParams.category}
                            onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
                        >
                            <option value="all">All Categories</option>
                            <option value="Phone">Phone</option>
                            <option value="Wallet">Wallet</option>
                            <option value="ID">ID Card</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Bag">Bag / Backpack</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <PackageOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900">No items found</h3>
                    <p className="mt-2 text-gray-500">Try adjusting your search criteria or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all transform hover:-translate-y-1 group">
                            {/* Image Header */}
                            <div className="h-48 bg-gray-200 relative overflow-hidden">
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                )}
                                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm
                  ${item.itemType === 'lost' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
                                    {item.itemType}
                                </div>
                                {item.itemType === 'lost' && item.urgency === 'High' && (
                                    <div className="absolute top-4 left-4 border border-red-500/30 bg-red-100/90 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-md">
                                        Urgent
                                    </div>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={item.title}>{item.title}</h3>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">{item.description}</p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Tag className="w-4 h-4 mr-2 text-indigo-400" />
                                        {item.category}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 truncate" title={item.location}>
                                        <MapPin className="w-4 h-4 mr-2 text-indigo-400 flex-shrink-0" />
                                        <span className="truncate">{item.location}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                                        {item.itemType === 'lost' ? 'Lost on ' : 'Found on '}
                                        {format(new Date(item.itemType === 'lost' ? item.dateLost : item.dateFound), 'MMM d, yyyy')}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedItem(item)}
                                    disabled={item.postedBy === user?._id}
                                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm
                    ${item.postedBy === user?._id
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : item.itemType === 'lost'
                                                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                >
                                    {item.postedBy === user?._id ? "Your Post" : (item.itemType === 'lost' ? 'I Found This' : 'Claim This Item')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ClaimModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />
        </div>
    );
};

export default Search;
