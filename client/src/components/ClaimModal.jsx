import React, { useState } from 'react';
import axios from 'axios';
import { X, UploadCloud, AlertCircle } from 'lucide-react';

const ClaimModal = ({ item, isOpen, onClose }) => {
    const [proofImage, setProofImage] = useState('');
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!proofImage.startsWith('http')) {
                setError('Please provide a valid image URL for proof.');
                setLoading(false);
                return;
            }

            await axios.post(`${import.meta.env.VITE_API_URL}/claims`, {
                itemId: item._id,
                itemType: item.itemType, // 'lost' or 'found'
                proofImage,
                explanation
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setProofImage('');
                setExplanation('');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit claim');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">
                        {item.itemType === 'found' ? 'Claim This Item' : 'I Found This Item'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto flex items-center justify-center p-3 h-16 w-16 rounded-full bg-green-100 text-green-500 mb-4 shadow-sm transform transition-all">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Request Sent!</h3>
                            <p className="mt-2 text-gray-500 text-sm">The poster has been notified. Check your dashboard for updates and chat access once approved.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-4 mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                {item.image && (
                                    <img src={item.image} alt="" className="w-16 h-16 rounded-lg object-cover shadow-sm" />
                                )}
                                <div>
                                    <p className="font-semibold text-gray-900">{item.title}</p>
                                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center shadow-sm">
                                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Why are you claiming this? (Provide proof)
                                    </label>
                                    <textarea
                                        required
                                        rows="3"
                                        placeholder={item.itemType === 'found' ? "Describe a hidden detail only the owner would know..." : "Where did you find it? Tell the poster..."}
                                        className="w-full text-gray-800 rounded-xl border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-white block"
                                        value={explanation}
                                        onChange={(e) => setExplanation(e.target.value)}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <UploadCloud className="w-4 h-4 mr-1 text-gray-400" /> Proof Image URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/receipt.jpg"
                                        className="w-full text-gray-800 rounded-xl border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-white block"
                                        value={proofImage}
                                        onChange={(e) => setProofImage(e.target.value)}
                                    />
                                    <p className="mt-1 flex text-xs text-gray-500">
                                        A picture of the receipt, original box, or the item itself.
                                    </p>
                                </div>

                                <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !explanation.trim()}
                                        className="px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Claim'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClaimModal;
