import React, { useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import SearchFilterBar from '../components/home/SearchFilterBar';
import ItemCard from '../components/ui/ItemCard';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const MOCK_ITEMS = [
    {
        id: '1',
        title: 'MacBook Pro M2 - Space Gray',
        category: 'Electronics',
        status: 'lost',
        location: 'Main Library, 3rd Floor Study Area',
        date: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',
    },
    {
        id: '2',
        title: 'Leather Wallet with IDs',
        category: 'Wallets',
        status: 'found',
        location: 'Student Union Cafeteria',
        date: new Date(Date.now() - 86400000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1000',
    },
    {
        id: '3',
        title: 'Sony WH-1000XM4 Headphones',
        category: 'Electronics',
        status: 'lost',
        location: 'Engineering Building, Room 204',
        date: new Date(Date.now() - 172800000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=1000',
    },
    {
        id: '4',
        title: 'Keys with Honda Fob',
        category: 'Keys',
        status: 'found',
        location: 'South Parking Lot near Entrance C',
        date: new Date(Date.now() - 10000000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=1000',
    },
    {
        id: '6',
        title: 'Hydroflask Water Bottle (Yellow)',
        category: 'Other',
        status: 'found',
        location: 'Recreation Center',
        date: new Date(Date.now() - 120000000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=1000',
    }
];

const Home = () => {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <HeroSection />
            <SearchFilterBar />

            {/* Recent Items Section */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-2"
                        >
                            Recent Activity
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-text-muted font-body"
                        >
                            The latest lost and found items from the community.
                        </motion.p>
                    </div>
                    <Link to="/search" className="hidden sm:block">
                        <Button variant="ghost">View All Items</Button>
                    </Link>
                </div>

                {/* Bento Grid layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[360px]">
                    {MOCK_ITEMS.map((item, index) => (
                        <div
                            key={item.id}
                            className={cn(
                                "w-full h-full",
                                // Feature the first item larger
                                index === 0 ? "lg:col-span-2 lg:row-span-2" : "",
                                // Make the 4th item span 2 columns
                                index === 3 ? "lg:col-span-2" : ""
                            )}
                        >
                            <ItemCard item={item} />
                        </div>
                    ))}
                </div>

                <div className="mt-10 sm:hidden flex justify-center">
                    <Link to="/search" className="w-full">
                        <Button variant="outline" className="w-full">View All Items</Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
