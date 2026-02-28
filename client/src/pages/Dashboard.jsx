import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { PackageSearch, AlertCircle, FileCheck2, Clock, MapPin, Tag } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        activeLost: 0,
        activeFound: 0,
        pendingClaims: 0,
    });
    const [myClaims, setMyClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [claimsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/claims`)
                ]);

                // This is simplified. In a real app we'd fetch lost/found by user to get exact stats
                const claims = claimsRes.data.myClaims || [];
                setMyClaims(claims);
                setStats({
                    activeLost: 0, // Placeholder
                    activeFound: 0, // Placeholder
                    pendingClaims: claims.filter(c => c.status === 'pending').length
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Welcome back, {user?.name}</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/post-lost" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors">
                        Report Lost
                    </Link>
                    <Link to="/post-found" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors">
                        Found Something
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md">
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-red-100 rounded-xl p-3">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">My Lost Items</dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-2xl font-semibold text-gray-900">{stats.activeLost}</div>
                                        <span className="ml-2 text-sm text-gray-500">active items</span>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md">
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-xl p-3">
                                <PackageSearch className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">My Found Reports</dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-2xl font-semibold text-gray-900">{stats.activeFound}</div>
                                        <span className="ml-2 text-sm text-gray-500">reports</span>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md">
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-100 rounded-xl p-3">
                                <FileCheck2 className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Claims</dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-2xl font-semibold text-gray-900">{stats.pendingClaims}</div>
                                        <span className="ml-2 text-sm text-gray-500">awaiting review</span>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Claims List */}
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">My Item Claims</h2>
            {myClaims.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No active claims</h3>
                    <p className="mt-1 text-sm text-gray-500">You haven't claimed any items yet. Search the board if you lost something.</p>
                    <Link to="/search" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                        Search Items
                    </Link>
                </div>
            ) : (
                <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                        {myClaims.map((claim) => (
                            <li key={claim._id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0 flex gap-4">
                                        {claim.itemId?.image && (
                                            <img src={claim.itemId.image} alt="" className="h-16 w-16 rounded-lg object-cover bg-gray-100" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 truncate">{claim.itemId?.title || 'Unknown Item'}</p>
                                            <div className="mt-1 flex items-center text-sm text-gray-500 gap-4">
                                                <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> {claim.itemId?.category || 'Standard'}</span>
                                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {format(new Date(claim.createdAt), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(claim.status)} capitalize`}>
                                            {claim.status.replace('_', ' ')}
                                        </span>
                                        {claim.status === 'approved' && (
                                            <Link to={`/chat/${claim._id}`} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
                                                Open Chat &rarr;
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
