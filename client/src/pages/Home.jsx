import React from 'react';
import { Link } from 'react-router-dom';
import { Search, PackagePlus, ShieldCheck, ArrowRight, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-16 animate-fade-in pb-16">
            {/* Hero Section */}
            <section className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 px-6 py-16 md:py-24 md:px-12 flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-[-10%] w-96 h-96 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-red-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
                </div>

                <div className="relative z-10 max-w-3xl">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        Lost it? <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-red-500">Find it.</span>
                    </h1>
                    <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                        The official campus community board dedicated to reuniting students with their lost belongings through smart matching and verified claims.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        {user ? (
                            <>
                                <Link to="/search" className="inline-flex justify-center items-center px-8 py-3.5 border border-transparent text-lg font-medium rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                                    Search Board <Search className="ml-2 w-5 h-5" />
                                </Link>
                                <Link to="/post-found" className="inline-flex justify-center items-center px-8 py-3.5 border border-gray-200 text-lg font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm w-full sm:w-auto">
                                    I Found Something <PackagePlus className="ml-2 w-5 h-5 text-green-500" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/register" className="inline-flex justify-center items-center px-8 py-3.5 border border-transparent text-lg font-medium rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                                    Join Community <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                                <Link to="/search" className="inline-flex justify-center items-center px-8 py-3.5 border border-gray-200 text-lg font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm w-full sm:w-auto">
                                    Browse Items
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Stats/Features Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 transform -rotate-3">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Students</h3>
                    <p className="text-gray-600">Exclusive access via .edu email addresses ensures a trusted community.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 transform rotate-3">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Campus Wide Scope</h3>
                    <p className="text-gray-600">Filter and search items by exact campus buildings and locations.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Claims</h3>
                    <p className="text-gray-600">Instantly submit proof and chat live with finders to arrange safe returns.</p>
                </div>
            </section>

            {/* Call to action */}
            <section className="bg-gray-900 rounded-3xl overflow-hidden shadow-xl mx-4 relative">
                {/* Abstract background shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500 opacity-20 blur-3xl rounded-full"></div>

                <div className="px-6 py-16 md:py-20 md:px-12 flex flex-col md:flex-row items-center justify-between relative z-10">
                    <div className="md:w-2/3 mb-10 md:mb-0 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Lose something important?</h2>
                        <p className="text-gray-300 text-lg max-w-xl">Don't panic. Post it on the board and let the community help you find it fast.</p>
                    </div>
                    <div className="md:w-1/3 flex justify-center md:justify-end">
                        <Link to="/post-lost" className="px-8 py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all transform hover:-translate-y-1">
                            Report Lost Item
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
