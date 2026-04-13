import React from 'react';
import { motion } from 'framer-motion';

const MobileLoader = ({ size = 80, className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* outer glowing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-emerald-500/20"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* spinning accent ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-t-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />

        {/* The Branded Icon - High Vibrancy */}
        <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center p-4">
          <motion.svg
            viewBox="0 0 512 512"
            className="w-full h-full text-emerald-500 fill-current drop-shadow-[0_4px_10px_rgba(16,185,129,0.4)]"
            animate={{
              scale: [1, 1.05, 1],
              y: [0, -4, 0]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M160 144c0-17.673-14.327-32-32-32H64c-17.673 0-32 14.327-32 32s14.327 32 32 32h32l42.4 201.2C143.1 391 155 400 169 400h187c14.6 0 27-10 29.8-24.4l33.8-173.6C423 184.8 409.8 176 396 176H179.7l-9.1-43.2C167.3 147 163.5 144 160 144zM192 464c26.5 0 48-21.5 48-48s-21.5-48-48-48-48 21.5-48 48 21.5 48 48 48zm160 0c26.5 0 48-21.5 48-48s-21.5-48-48-48-48 21.5-48 48 21.5 48 48 48z" />
          </motion.svg>
        </div>
      </div>

      {/* Brand Label Underneath */}
      <div className="mt-6 flex flex-col items-center">
        <h2 className="text-sm font-black tracking-[0.4em] text-zinc-900 dark:text-white uppercase italic opacity-80">
          Apna<span className="text-emerald-500">Cart</span>
        </h2>
        {/* Micro loading progress dots */}
        <div className="flex gap-1.5 mt-3">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileLoader;
