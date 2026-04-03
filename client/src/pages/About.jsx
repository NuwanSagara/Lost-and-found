import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-screen">

            {/* Hero Header */}
            <div className="text-center max-w-4xl mx-auto mb-20 relative z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 border border-white/10 text-brand-secondary text-sm font-medium tracking-widest uppercase"
                >
                    Our Mission
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl sm:text-7xl font-display font-extrabold text-white tracking-tight leading-[1.1] mb-8"
                >
                    Reuniting students with <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">what matters most.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-text-muted font-body leading-relaxed max-w-2xl mx-auto"
                >
                    CampusFound was built to solve a simple problem: lost items shouldn't stay lost.
                    We provide a beautiful, secure, and lightning-fast community board for the modern campus.
                </motion.p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-24">
                {[
                    { label: 'Active Users', value: '15k+' },
                    { label: 'Items Reunited', value: '2,847' },
                    { label: 'Success Rate', value: '98%' },
                    { label: 'Campus Partners', value: '12' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-8 rounded-3xl border border-surface-glass-border text-center hover:bg-white/5 transition-colors"
                    >
                        <h3 className="text-4xl sm:text-5xl font-display font-bold text-white mb-2 font-mono">{stat.value}</h3>
                        <p className="text-sm uppercase tracking-widest text-text-muted font-bold">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Features/Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="glass-panel-heavy p-10 sm:p-12 rounded-3xl border border-brand-primary/30 relative overflow-hidden"
                >
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/20 blur-3xl rounded-full"></div>
                    <ShieldCheck size={40} className="text-brand-primary mb-6 relative z-10" />
                    <h2 className="text-3xl font-display font-bold text-white mb-4 relative z-10">Secure Verification</h2>
                    <p className="text-text-muted text-lg relative z-10">
                        Only verified students with active `.edu` email addresses can access the platform, ensuring safe handoffs and preventing scams.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="glass-panel-heavy p-10 sm:p-12 rounded-3xl border border-brand-secondary/30 relative overflow-hidden"
                >
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-secondary/20 blur-3xl rounded-full"></div>
                    <HeartHandshake size={40} className="text-brand-secondary mb-6 relative z-10" />
                    <h2 className="text-3xl font-display font-bold text-white mb-4 relative z-10">Community First</h2>
                    <p className="text-text-muted text-lg relative z-10">
                        Built by students, for students. We believe in the inherent honesty of our campus community and provide the tools to foster it.
                    </p>
                </motion.div>
            </div>

            {/* CTA */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center border-t border-surface-glass-border pt-20"
            >
                <h2 className="text-3xl font-display font-bold text-white mb-6">Ready to join the community?</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/signup">
                        <Button size="lg" className="min-w-[200px]">Sign Up Now</Button>
                    </Link>
                    <Link to="/search">
                        <Button variant="outline" size="lg" className="min-w-[200px]">Browse Items</Button>
                    </Link>
                </div>
            </motion.div>

        </div>
    );
}

export default About;
