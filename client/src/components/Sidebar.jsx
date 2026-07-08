import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGrid, 
  FiFolder, 
  FiLayers, 
  FiCheckSquare, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight,
  FiBookOpen,
  FiLogOut,
  FiX
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('notes_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('notes_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
    { name: 'Generate Notes', path: '/dashboard/generate', icon: HiSparkles },
    { name: 'My Notes', path: '/dashboard/notes', icon: FiFolder },
    { name: 'Flashcards', path: '/dashboard/flashcards', icon: FiLayers },
    { name: 'Take Quiz', path: '/dashboard/quiz', icon: FiCheckSquare },
    { name: 'Settings', path: '/dashboard/settings', icon: FiSettings },
  ];

  const sidebarVariants = {
    expanded: { width: 240, transition: { duration: 0.3, ease: 'easeInOut' } },
    collapsed: { width: 80, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const mobileSidebarVariants = {
    open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="h-full flex flex-col justify-between py-6 px-4">
      {/* Branding */}
      <div>
        <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'} mb-8`}>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[rgb(var(--accent-color))] to-violet-400 text-white shadow-md">
              <FiBookOpen className="text-lg" />
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="font-display font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                Notegen<span className="text-[rgb(var(--accent-color))]">.ai</span>
              </span>
            )}
          </Link>

          {isMobile && (
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 cursor-pointer"
            >
              <FiX className="text-base" />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer group
                  ${isItemActive 
                    ? 'bg-[rgb(var(--accent-color))] text-white shadow-md shadow-violet-500/10' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'}
                `}
              >
                <Icon className={`text-lg flex-shrink-0 ${isItemActive ? 'scale-105' : 'group-hover:scale-105 transition-transform'}`} />
                {(!isCollapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer: Logout + Collapse */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { logout(); navigate('/auth'); }}
          className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 cursor-pointer ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <FiLogOut className="text-lg flex-shrink-0" />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
        </button>

        {/* Desktop Collapse Button */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center p-2.5 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 cursor-pointer"
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        className="hidden md:block h-screen sticky top-0 left-0 bg-[#0a0d16] border-r border-white/[0.06] z-30 shadow-sm overflow-y-auto no-scrollbar flex-shrink-0"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            />
            {/* Mobile Drawer */}
            <motion.aside
              variants={mobileSidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0d16] shadow-2xl h-screen overflow-y-auto no-scrollbar"
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
