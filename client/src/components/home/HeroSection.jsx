import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '../ui/Button';
import { ArrowRight, Key, Smartphone, Wallet, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const NumberCounter = ({ target, duration = 2, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            
            // easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(easeProgress * target));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [target, duration]);

    return (
        <span className="text-4xl md:text-5xl font-display font-bold text-white mb-2 font-mono">
            {count.toLocaleString()}{suffix}
        </span>
    );
};

const floatingAnimation = (delay) => ({
    y: ["-20px", "20px"],
    rotate: ["-5deg", "5deg"],
    transition: {
        y: { duration: 3 + delay, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
        rotate: { duration: 4 + delay, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
    }
});

const HeroSection = () => {
    return (
        <div className="relative min-h-[95vh] flex items-center justify-center overflow-hidden w-full full-bleed -mt-8 pt-24 pb-16">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
            <div className="campusfound-grid"></div>

            {/* Animated gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-secondary/20 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

            {/* 3D Floating Icons */}
            <motion.div 
                className="absolute top-[20%] left-[15%] hidden lg:flex items-center justify-center w-24 h-24 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] rotate-[-12deg]"
                animate={floatingAnimation(0)}
            >
                <Key size={48} className="text-brand-secondary/80" strokeWidth={1.5} />
            </motion.div>
            
            <motion.div 
                className="absolute top-[30%] right-[15%] hidden lg:flex items-center justify-center w-28 h-28 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(255,107,53,0.1)] rotate-[15deg]"
                animate={floatingAnimation(1)}
            >
                <Wallet size={56} className="text-brand-primary/80" strokeWidth={1.5} />
            </motion.div>
            
            <motion.div 
                className="absolute bottom-[25%] left-[20%] hidden lg:flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(81,207,102,0.1)] rotate-[-8deg]"
                animate={floatingAnimation(0.5)}
            >
                <Smartphone size={40} className="text-tag-found/80" strokeWidth={1.5} />
            </motion.div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md mb-8 border border-brand-secondary/30 text-brand-secondary text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(0,212,170,0.15)]"
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-full w-full bg-brand-secondary"></span>
                    </span>
                    Next-Gen Campus Retrieval
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    className="text-6xl sm:text-7xl lg:text-[90px] font-display font-bold leading-[1.05] tracking-tight mb-8 text-white"
                >
                    Someone's waiting for <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-[#FF8C5A]">their lost treasure.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-12 font-body leading-relaxed"
                >
                    Join the community network helping everyone reunite with what belongs to them. Fast, secure, and intuitive.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center gap-5 justify-center"
                >
                    <Link to="/report">
                        <Button size="lg" className="w-full sm:w-auto px-8 h-14 text-base font-bold bg-gradient-to-r from-brand-primary to-[#FF8C5A] border-none shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:shadow-[0_15px_40px_rgba(255,107,53,0.4)] hover:scale-[1.03] transition-all">
                            Report Lost Item
                        </Button>
                    </Link>
                    <Link to="/post-found">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 h-14 text-base font-bold border-white/20 hover:bg-white/5 hover:border-white/40 hover:scale-[1.03] transition-all bg-surface-glass backdrop-blur-md text-white">
                            I Found Something
                        </Button>
                    </Link>
                </motion.div>

                {/* Counter section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="mt-24 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
                >
                    <div className="flex flex-col items-center justify-center relative">
                        <NumberCounter target={2847} />
                        <span className="text-text-muted text-xs font-bold tracking-[0.2em] uppercase mt-1">Items Reunited</span>
                        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-white/10"></div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center relative">
                        <NumberCounter target={98} suffix="%" />
                        <span className="text-text-muted text-xs font-bold tracking-[0.2em] uppercase mt-1">Success Rate</span>
                        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-white/10"></div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center px-4">
                        <ShieldCheck className="text-brand-secondary mb-3 drop-shadow-[0_0_15px_rgba(0,212,170,0.5)]" size={42} />
                        <span className="text-white font-bold text-lg mb-1">Verified Community</span>
                        <span className="text-text-muted text-xs font-medium">Secure item handoffs</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroSection;
