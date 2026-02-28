import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, User, LogOut, PlusCircle } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                CampusFound
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link to="/search" className="text-gray-600 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <Search size={20} />
                                </Link>

                                <div className="relative group">
                                    <button className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors">
                                        <PlusCircle size={18} className="mr-2" />
                                        Post Item
                                    </button>
                                    {/* Dropdown Menu for posting */}
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <Link to="/post-lost" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">Report Lost Item</Link>
                                        <Link to="/post-found" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">Report Found Item</Link>
                                    </div>
                                </div>

                                <Link to="/notifications" className="text-gray-600 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <Bell size={20} />
                                </Link>

                                <div className="relative group ml-3">
                                    <button className="flex items-center text-sm focus:outline-none">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm text-gray-900 font-medium">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center"><User size={16} className="mr-2" /> Dashboard</Link>
                                        <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><LogOut size={16} className="mr-2" /> Sign out</button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Log in
                                </Link>
                                <Link to="/register" className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
