import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, 
  FiSearch, 
  FiBook, 
  FiPlus, 
  FiX, 
  FiChevronRight, 
  FiLogOut
} from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { useKeyboard } from '../hooks/useKeyboard';
import PomodoroTimer from '../components/PomodoroTimer';

export default function DashboardLayout() {
  const { notes } = useNotes();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeResultIdx, setActiveResultIdx] = useState(-1);

  // Pull user info directly from auth context (always up-to-date)
  const userName = user?.username || 'Student';
  const userCourse = user?.course || '';

  // Handle global keyboard shortcuts
  useKeyboard({
    onGenerateNotes: () => navigate('/dashboard/generate'),
    onMyNotes: () => navigate('/dashboard/notes'),
    onSearch: () => setSearchOpen(true),
    onEscape: () => {
      setSearchOpen(false);
      setMobileSidebarOpen(false);
    }
  });

  // Get a short snippet with the keyword highlighted
  const getSnippet = (content = '', query = '') => {
    if (!content || !query) return '';
    const idx = content.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return content.substring(0, 80) + '...';
    const start = Math.max(0, idx - 30);
    const end = Math.min(content.length, idx + query.length + 60);
    const snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
    return snippet;
  };

  // Highlight matching text in a string
  const highlightMatch = (text = '', query = '') => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-violet-500/30 text-violet-300 rounded px-0.5 not-italic">{part}</mark>
        : part
    );
  };

  // Filter search results including note content
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setActiveResultIdx(-1);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        note.subject.toLowerCase().includes(q) ||
        note.topic.toLowerCase().includes(q) ||
        (note.content && note.content.toLowerCase().includes(q))
    );
    setSearchResults(filtered.slice(0, 6));
    setActiveResultIdx(-1);
  }, [searchQuery, notes]);

  const handleSearchResultClick = (noteId) => {
    setSearchOpen(false);
    setSearchQuery('');
    setActiveResultIdx(-1);
    navigate(`/dashboard/notes?id=${noteId}`);
  };

  // Keyboard navigation inside the search modal
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveResultIdx(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveResultIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeResultIdx >= 0) {
      e.preventDefault();
      handleSearchResultClick(searchResults[activeResultIdx].id);
    }
  };

  // Extract Initials for User Profile
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#070a13] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen relative">
        
        {/* Ambient background blur circles */}
        <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-violet-500/5 blur-[80px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none z-0" />

        {/* Dashboard Header Navbar */}
        <header className="sticky top-0 z-20 glass-panel border-b border-gray-200/10 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
              aria-label="Open Sidebar"
            >
              <FiMenu className="text-lg" />
            </button>
            
            {/* Quick search shortcut trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 border border-gray-200/20 hover:border-gray-200/40 rounded-xl bg-gray-50/50 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900/60 transition-all text-left w-48 sm:w-64 cursor-pointer shadow-xs"
            >
              <FiSearch className="text-gray-400" />
              <span className="flex-grow truncate text-xs">Search notes...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xxs font-semibold bg-gray-200 dark:bg-gray-800 rounded-md border border-gray-300/30">
                Ctrl+F
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Notes Generation button */}
            <Link
              to="/dashboard/generate"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] rounded-xl transition-all shadow-md cursor-pointer"
            >
              <FiPlus /> New Note
            </Link>

            {/* Profile avatar widget */}
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-2 p-1 border border-white/10 hover:border-white/20 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-all cursor-pointer shadow-xs"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={userName}
                  className="h-8 w-8 rounded-lg object-cover border border-white/10"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                  {getInitials(userName)}
                </div>
              )}
              <div className="hidden lg:block text-left pr-2">
                <p className="text-xs font-semibold leading-tight text-white">{userName}</p>
                {userCourse && <p className="text-[10px] text-gray-400 leading-tight">{userCourse}</p>}
              </div>
            </Link>

            {/* Logout button */}
            <button
              onClick={() => { logout(); }}
              className="p-2.5 rounded-xl border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
              aria-label="Logout"
              title="Sign out"
            >
              <FiLogOut className="text-base" />
            </button>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-grow p-6 z-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Search Overlay (Modal) */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-xs">
            {/* Backdrop click close */}
            <div className="absolute inset-0" onClick={() => setSearchOpen(false)} />

            {/* Command search box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#0f1423] border border-gray-200/10 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200/10">
                <FiSearch className="text-gray-400 text-lg flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search titles, subjects, topics, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full bg-transparent border-0 outline-hidden focus:ring-0 text-sm placeholder-gray-500"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  <FiX />
                </button>
              </div>

              {/* Search Results list */}
              <div className="max-h-80 overflow-y-auto py-2">
                {searchQuery.trim() === '' ? (
                  <div className="px-6 py-8 text-center text-gray-400">
                    <FiBook className="mx-auto text-3xl mb-2 opacity-50" />
                    <p className="text-sm">Search note titles, subjects, topics and content</p>
                    <p className="text-xs text-gray-500 mt-1">Use ↑ ↓ arrows to navigate · Enter to open · ESC to close</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400">
                    <p className="text-sm">No notes found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <>
                    <p className="px-4 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </p>
                    {searchResults.map((note, idx) => {
                      const q = searchQuery.toLowerCase();
                      const matchesContent = note.content && note.content.toLowerCase().includes(q);
                      const snippet = matchesContent ? getSnippet(note.content, searchQuery) : null;
                      const isActive = idx === activeResultIdx;
                      return (
                        <button
                          key={note.id}
                          onClick={() => handleSearchResultClick(note.id)}
                          className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-colors duration-100 cursor-pointer ${
                            isActive
                              ? 'bg-violet-500/10 border-l-2 border-violet-500'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 border-l-2 border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-grow">
                            <p className="text-sm font-semibold truncate text-[rgb(var(--accent-color))]">
                              {highlightMatch(note.title, searchQuery)}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <span>{highlightMatch(note.subject, searchQuery)}</span>
                              <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                              <span className="truncate">{highlightMatch(note.topic, searchQuery)}</span>
                            </p>
                            {snippet && (
                              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                                {highlightMatch(snippet, searchQuery)}
                              </p>
                            )}
                          </div>
                          <FiChevronRight className={`text-sm flex-shrink-0 mt-0.5 transition-colors ${isActive ? 'text-violet-400' : 'text-gray-400'}`} />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pomodoro Timer — floats above all content */}
      <PomodoroTimer />
    </div>
  );
}
