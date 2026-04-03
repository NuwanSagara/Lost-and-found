import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const buttonVariants = {
    default: "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-[0_0_20px_rgba(108,99,255,0.3)] hover:shadow-[0_0_25px_rgba(108,99,255,0.5)]",
    outline: "border border-surface-glass-border bg-transparent hover:bg-surface-glass text-text-primary",
    glass: "glass-panel text-text-primary hover:bg-white/10",
    ghost: "hover:bg-surface-glass text-text-primary",
};

const buttonSizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 py-2",
    lg: "h-14 px-8 text-lg",
    icon: "h-10 w-10",
};

const Button = React.forwardRef(({
    className,
    variant = "default",
    size = "md",
    children,
    ...props
}, ref) => {
    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary disabled:opacity-50 disabled:pointer-events-none ring-offset-bg-dark",
                buttonVariants[variant],
                buttonSizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
});

Button.displayName = "Button";

export { Button, buttonVariants };
