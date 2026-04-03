import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                "rounded-2xl glass-panel relative overflow-hidden bg-white/5",
                className
            )}
            {...props}
        >
            <motion.div
                className="absolute inset-0 -translate-x-full"
                animate={{
                    translateX: ['-100%', '200%'],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                }}
                style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                }}
            />
        </div>
    );
};

export const CardSkeleton = () => {
    return (
        <div className="flex flex-col h-full rounded-2xl overflow-hidden glass-panel border border-surface-glass-border">
            {/* Image Placeholder */}
            <Skeleton className="w-full aspect-video rounded-none border-b border-surface-glass-border" />
            
            {/* Content Placeholder */}
            <div className="p-6 flex flex-col flex-grow gap-4">
                <Skeleton className="h-8 w-3/4 rounded-lg" />
                <div className="space-y-3 mt-4">
                    <Skeleton className="h-5 w-1/2 rounded-md" />
                    <Skeleton className="h-5 w-2/3 rounded-md" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl mt-auto" />
            </div>
        </div>
    );
};
