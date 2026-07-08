import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export default function Modal({ isOpen, title, onClose, children, size = 'md' }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          {/* Backdrop Click Close */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative w-full ${sizes[size]} bg-white dark:bg-[#0f1423] border border-gray-200/10 rounded-2xl shadow-2xl overflow-hidden z-10`}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-200/10">
                <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  aria-label="Close Modal"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
