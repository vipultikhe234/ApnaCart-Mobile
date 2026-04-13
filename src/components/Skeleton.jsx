import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className, width, height, borderRadius = "12px" }) => {
    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
            }}
            className={`bg-zinc-200 dark:bg-zinc-800/50 ${className}`}
            style={{ 
                width: width || '100%', 
                height: height || '20px',
                borderRadius: borderRadius
            }}
        />
    );
};

export const ProductCardSkeleton = () => (
    <div className="flex gap-4 p-4 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-900 shadow-sm">
        <Skeleton width="100px" height="100px" borderRadius="20px" />
        <div className="flex-1 space-y-3 py-2">
            <Skeleton width="60%" height="16px" />
            <Skeleton width="90%" height="12px" />
            <div className="flex justify-between items-center pt-2">
                <Skeleton width="30%" height="20px" />
                <Skeleton width="50px" height="30px" borderRadius="10px" />
            </div>
        </div>
    </div>
);

export const MerchantCardSkeleton = () => (
    <div className="space-y-3 mb-6">
        <Skeleton height="180px" borderRadius="32px" />
        <div className="px-2 space-y-2">
            <div className="flex justify-between items-center">
                <Skeleton width="60%" height="18px" />
                <Skeleton width="40px" height="18px" />
            </div>
            <Skeleton width="90%" height="12px" />
        </div>
    </div>
);

export const CategorySkeleton = () => (
    <div className="flex flex-col items-center gap-2 min-w-[70px]">
        <Skeleton width="64px" height="64px" borderRadius="100%" />
        <Skeleton width="40px" height="10px" />
    </div>
);

export default Skeleton;
