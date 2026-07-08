import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBookOpen, FiArrowRight, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/[0.06] px-6 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Branding Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
            <FiBookOpen className="text-xl" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            Notegen<span className="text-violet-400">.ai</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`relative font-medium text-sm transition-colors duration-200 ${
                isActive(link.path)
                  ? 'text-violet-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <motion.div
                  layoutId="activeNavTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-violet-400"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-4.5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-500/20 cursor-pointer"
            >
              Dashboard <FiArrowRight />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-4.5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-500/20 cursor-pointer"
            >
              Sign In <FiArrowRight />
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl border border-white/10 text-gray-400 cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 overflow-hidden border-t border-white/[0.06] pt-4"
          >
            <div className="flex flex-col gap-4 pb-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isActive(link.path)
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <Link
                to={user ? '/dashboard' : '/auth'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md cursor-pointer"
              >
                {user ? 'Dashboard' : 'Sign In'} <FiArrowRight className="text-sm" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
