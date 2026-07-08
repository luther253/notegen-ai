import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export default function Toast({ show, message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (show && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const icons = {
    success: <FiCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />,
    error: <FiAlertCircle className="text-rose-500 text-lg flex-shrink-0" />,
    info: <FiInfo className="text-blue-500 text-lg flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/20 dark:border-emerald-500/30',
    error: 'border-rose-500/20 dark:border-rose-500/30',
    info: 'border-blue-500/20 dark:border-blue-500/30',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-2xl glass-panel border ${borders[type]} shadow-xl max-w-sm`}
        >
          {icons[type]}
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 pr-4">{message}</p>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            aria-label="Close Notification"
          >
            <FiX className="text-sm" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
