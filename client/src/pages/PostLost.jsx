import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, UploadCloud, MapPin, Tag, Calendar, FileText } from 'lucide-react';

const PostLost = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageName, setImageName] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        category: 'Other',
        description: '',
        location: '',
        dateLost: '',
        image: '',
        urgency: 'Normal'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            setFormData({ ...formData, image: '' });
            setImageName('');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please choose a valid image file.');
            e.target.value = '';
            setFormData({ ...formData, image: '' });
            setImageName('');
            return;
        }

        const maxFileSize = 5 * 1024 * 1024;
        if (file.size > maxFileSize) {
            setError('Image must be smaller than 5MB.');
            e.target.value = '';
            setFormData({ ...formData, image: '' });
            setImageName('');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setError('');
            setImageName(file.name);
            setFormData((currentFormData) => ({
                ...currentFormData,
                image: reader.result,
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.image) {
                setError('Please upload an image before submitting.');
                setLoading(false);
                return;
            }

            await axios.post(`${import.meta.env.VITE_API_URL}/lost`, formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post lost item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
                    <h1 className="text-2xl font-bold text-white">Report a Lost Item</h1>
                    <p className="mt-1 text-red-100">Provide details to help the community find your item.</p>
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
                                    placeholder="e.g. Blue Hydroflask Water Bottle"
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3 border bg-gray-50"
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
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3 border bg-gray-50"
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
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" /> Date Lost
                                </label>
                                <input
                                    type="date"
                                    name="dateLost"
                                    required
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3 border bg-gray-50"
                                    value={formData.dateLost}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" /> Last Seen Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    required
                                    placeholder="e.g. Library 2nd Floor, near the printers"
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3 border bg-gray-50"
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
                                    placeholder="Describe colors, brands, identifying marks, or contents..."
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3 border bg-gray-50"
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <UploadCloud className="w-4 h-4 mr-1 text-gray-400" /> Upload Image (Required)
                                </label>
                                <input
                                    type="file"
                                    name="image"
                                    required
                                    accept="image/*"
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3 border bg-gray-50"
                                    onChange={handleImageChange}
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    {imageName || 'Choose a photo from your device. Max size: 5MB.'}
                                </p>
                                {formData.image && (
                                    <img
                                        src={formData.image}
                                        alt="Selected lost item"
                                        className="mt-4 h-40 w-full rounded-xl object-cover border border-gray-200"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, urgency: 'Normal' })}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors overflow-hidden ${formData.urgency === 'Normal' ? 'bg-white shadow text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, urgency: 'High' })}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors overflow-hidden ${formData.urgency === 'High' ? 'bg-red-100 text-red-800 border border-red-200 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        High Priority
                                    </button>
                                </div>
                            </div>

                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 transition-colors"
                            >
                                {loading ? 'Posting...' : 'Post Lost Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostLost;
