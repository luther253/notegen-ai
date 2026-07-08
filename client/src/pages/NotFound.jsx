import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center relative z-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-8 animate-float"
      >
        <FiAlertTriangle className="text-6xl" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="font-display font-extrabold text-5xl md:text-7xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300"
      >
        404
      </motion.h1>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="font-display font-bold text-xl md:text-2xl mb-4 text-gray-800 dark:text-gray-200"
      >
        Oops! Page Not Found
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-md text-sm md:text-base text-gray-500 dark:text-gray-400 mb-8 leading-relaxed"
      >
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back to studying!
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex gap-4"
      >
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200/30 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-semibold text-sm cursor-pointer"
        >
          <FiHome /> Back to Home
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] transition-all font-semibold text-sm cursor-pointer shadow-lg"
        >
          Study Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
