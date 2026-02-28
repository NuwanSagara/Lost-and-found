import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, UploadCloud, MapPin, Tag, Calendar, FileText, UserMinus } from 'lucide-react';

const PostFound = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        category: 'Other',
        description: '',
        location: '',
        dateFound: '',
        image: '',
        isAnonymous: false
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.image.startsWith('http')) {
                setError('Please provide a valid direct image URL (starting with http)');
                setLoading(false);
                return;
            }

            await axios.post(`${import.meta.env.VITE_API_URL}/found`, formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post found item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
                    <h1 className="text-2xl font-bold text-white">Report a Found Item</h1>
                    <p className="mt-1 text-green-100">Help reunite someone with their lost property.</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center shadow-sm">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="e.g. Found AirPods Pro case"
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-3 border bg-gray-50"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Tag className="w-4 h-4 mr-1 text-gray-400" /> Category
                                </label>
                                <select
                                    name="category"
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-3 border bg-gray-50"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    <option value="Phone">Phone</option>
                                    <option value="Wallet">Wallet</option>
                                    <option value="ID">ID Card</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Bag">Bag / Backpack</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" /> Date Found
                                </label>
                                <input
                                    type="date"
                                    name="dateFound"
                                    required
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-3 border bg-gray-50"
                                    value={formData.dateFound}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" /> Return/Found Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    required
                                    placeholder="Where did you find it or where is it now?"
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-3 border bg-gray-50"
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FileText className="w-4 h-4 mr-1 text-gray-400" /> Detailed Description
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    rows="4"
                                    placeholder="Provide enough details for the owner to identify it (but maybe hold back one identifying feature to verify ownership)..."
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-3 border bg-gray-50"
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <UploadCloud className="w-4 h-4 mr-1 text-gray-400" /> Image URL (Required)
                                </label>
                                <input
                                    type="url"
                                    name="image"
                                    required
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-3 border bg-gray-50"
                                    value={formData.image}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="isAnonymous"
                                            name="isAnonymous"
                                            type="checkbox"
                                            className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                                            checked={formData.isAnonymous}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="isAnonymous" className="font-medium text-gray-700 flex items-center">
                                            <UserMinus className="w-4 h-4 mr-1 text-gray-500" /> Report Anonymously
                                        </label>
                                        <p className="text-gray-500">Your name will be hidden from the public post. Only admins can see who posted it.</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
                            >
                                {loading ? 'Posting...' : 'Post Found Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostFound;
