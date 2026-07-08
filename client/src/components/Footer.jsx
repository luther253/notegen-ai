import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiGithub, FiTwitter, FiHeart, FiLinkedin, FiFacebook } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="glass-panel border-t border-gray-200/20 px-6 py-8 mt-auto">
      <div className="max-w-[85rem] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[rgb(var(--accent-color))] to-violet-400 text-white">
            <FiBookOpen className="text-base" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-gray-900 dark:text-white">
            Notegen<span className="text-[rgb(var(--accent-color))]">.ai</span>
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 md:absolute md:left-1/2 md:-translate-x-1/2">
          <Link to="/" className="hover:text-[rgb(var(--accent-color))] transition-colors duration-200">Home</Link>
          <Link to="/about" className="hover:text-[rgb(var(--accent-color))] transition-colors duration-200">About</Link>
        </div>

        {/* Social / Credits */}
        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
          <span className="text-xs flex items-center gap-1">
            Made with <FiHeart className="text-red-500 fill-red-500 text-xxs" /> for Students
          </span>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[rgb(var(--accent-color))] transition-colors duration-200"
            aria-label="GitHub"
          >
            <FiGithub />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[rgb(var(--accent-color))] transition-colors duration-200"
            aria-label="Twitter"
          >
            <FiTwitter />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[rgb(var(--accent-color))] transition-colors duration-200"
            aria-label="LinkedIn"
          >
            <FiLinkedin />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[rgb(var(--accent-color))] transition-colors duration-200"
            aria-label="Facebook"
          >
            <FiFacebook />
          </a>
        </div>
      </div>
    </footer>
  );
}
