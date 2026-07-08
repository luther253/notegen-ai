import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiKey, 
  FiSliders, 
  FiTrash2, 
  FiCheckCircle, 
  FiAlertTriangle 
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import Toast from '../components/Toast';

export default function Settings() {
  const { theme, toggleTheme, themeColor, setThemeColor, fontSize, setFontSize } = useTheme();
  const { clearAllData } = useNotes();

  // Toast alert states
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  // Profile forms state
  const [userName, setUserName] = useState(() => localStorage.getItem('notes_user_name') || 'Student');
  const [userUni, setUserUni] = useState(() => localStorage.getItem('notes_user_uni') || 'Stanford University');
  const [userCourse, setUserCourse] = useState(() => localStorage.getItem('notes_user_course') || 'Computer Science');

  // AI config state
  const [apiProvider, setApiProvider] = useState(() => localStorage.getItem('notes_api_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('notes_api_key') || '');
  const [showKey, setShowKey] = useState(false);

  // Clear confirm state
  const [confirmClear, setConfirmClear] = useState(false);

  // Save profile helper
  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('notes_user_name', userName.trim());
    localStorage.setItem('notes_user_uni', userUni.trim());
    localStorage.setItem('notes_user_course', userCourse.trim());
    triggerToast('Profile information updated successfully!');
  };

  // Save AI Config helper
  const handleSaveAIConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('notes_api_provider', apiProvider);
    localStorage.setItem('notes_api_key', apiKey.trim());
    triggerToast('AI API configurations saved locally!');
  };

  // Reset workspace database
  const handleResetWorkspace = () => {
    clearAllData();
    setConfirmClear(false);
    triggerToast('Workspace database reset successfully.', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 relative z-10">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-gray-950 to-gray-700 dark:from-white dark:to-gray-400">
          Preferences & Settings
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Configure API keys, adjust workspace sizes, color styles, and edit profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Profile Edit & AI Config */}
        <div className="space-y-8">
          
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel border border-gray-200/10 p-6 rounded-2xl space-y-4"
          >
            <h2 className="flex items-center gap-2 font-display font-bold text-base text-gray-800 dark:text-white border-b border-gray-200/10 pb-3">
              <FiUser className="text-[rgb(var(--accent-color))]" /> Student Profile
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-1.5">User Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] focus:ring-0 outline-hidden font-medium"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-1.5">University</label>
                  <input
                    type="text"
                    value={userUni}
                    onChange={(e) => setUserUni(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] focus:ring-0 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Course / Major</label>
                  <input
                    type="text"
                    value={userCourse}
                    onChange={(e) => setUserCourse(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] focus:ring-0 outline-hidden"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold rounded-xl text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer shadow-md"
              >
                Save Profile
              </button>
            </form>
          </motion.div>

          {/* AI Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel border border-gray-200/10 p-6 rounded-2xl space-y-4"
          >
            <h2 className="flex items-center gap-2 font-display font-bold text-base text-gray-800 dark:text-white border-b border-gray-200/10 pb-3">
              <FiKey className="text-[rgb(var(--accent-color))]" /> AI Engine Config
            </h2>
            <form onSubmit={handleSaveAIConfig} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-1.5">API Provider</label>
                <select
                  value={apiProvider}
                  onChange={(e) => setApiProvider(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] focus:ring-0 outline-hidden cursor-pointer"
                >
                  <option value="gemini">Google Gemini (Recommended - v2.5 Flash)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                </select>
              </div>
              <div>
                <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>API Key</span>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-gray-400 hover:text-[rgb(var(--accent-color))] cursor-pointer font-bold lowercase tracking-normal normal-case"
                  >
                    {showKey ? 'hide key' : 'show key'}
                  </button>
                </label>
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={apiProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] focus:ring-0 outline-hidden font-mono"
                />
                <p className="text-xxs text-gray-500 dark:text-gray-400 mt-1.5 leading-normal">
                  If left blank, the app runs using the **Default Free Server AI**. You can override this by entering your own personal API key here if you want faster responses or unlimited generations.
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold rounded-xl text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer shadow-md"
              >
                Save API Keys
              </button>
            </form>
          </motion.div>

        </div>

        {/* Right Side: Theme customization & system reset */}
        <div className="space-y-8">
          
          {/* Custom Styles Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel border border-gray-200/10 p-6 rounded-2xl space-y-5"
          >
            <h2 className="flex items-center gap-2 font-display font-bold text-base text-gray-800 dark:text-white border-b border-gray-200/10 pb-3">
              <FiSliders className="text-[rgb(var(--accent-color))]" /> Visual Styles
            </h2>

            {/* Dark mode is permanently enabled */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">Theme Mode</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Application is locked to dark mode</p>
              </div>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/20 text-violet-400 select-none">
                🌙 Dark
              </span>
            </div>

            {/* Accent theme colors */}
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold">Accent Color</p>
                <p className="text-xxs text-gray-400 mt-0.5">Choose your primary aesthetic highlights</p>
              </div>
              <div className="flex gap-3">
                {[
                  { name: 'violet', bg: 'bg-violet-500' },
                  { name: 'blue', bg: 'bg-blue-500' },
                  { name: 'emerald', bg: 'bg-emerald-500' },
                  { name: 'amber', bg: 'bg-amber-500' },
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setThemeColor(color.name)}
                    className={`h-8 w-8 rounded-full ${color.bg} cursor-pointer transition-all flex items-center justify-center relative shadow-xs hover:scale-110`}
                  >
                    {themeColor === color.name && (
                      <span className="absolute h-3 w-3 rounded-full bg-white animate-scale shadow-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Font scales */}
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold">Text Font Size</p>
                <p className="text-xxs text-gray-400 mt-0.5">Scale document reading font dimensions</p>
              </div>
              <div className="grid grid-cols-4 gap-2 border border-gray-200/20 p-1.5 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                {['sm', 'base', 'lg', 'xl'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`py-1.5 text-xxs font-bold uppercase rounded-lg cursor-pointer transition-all ${
                      fontSize === sz 
                        ? 'bg-[rgb(var(--accent-color))] text-white shadow-xs' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Reset / Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel border border-rose-500/10 p-6 rounded-2xl space-y-4 bg-rose-500/[0.01]"
          >
            <h2 className="flex items-center gap-2 font-display font-bold text-base text-rose-500 border-b border-rose-500/10 pb-3">
              <FiTrash2 /> Danger Zone
            </h2>
            <div className="space-y-4">
              <p className="text-xxs md:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Clearing workspace data removes all generated student notes, customized subjects, and quiz files from your local browser database. This action is **irreversible**.
              </p>
              
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full py-2.5 text-xs font-bold rounded-xl text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  Clear All Data
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/5 text-amber-500 rounded-xl border border-amber-500/10">
                    <FiAlertTriangle className="flex-shrink-0" />
                    <span>Are you sure? This cannot be undone.</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="flex-1 py-2 text-xs font-bold border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetWorkspace}
                      className="flex-1 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl cursor-pointer"
                    >
                      Yes, Reset All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </div>

      </div>

      {/* Floating alert toast */}
      <Toast
        show={toastShow}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastShow(false)}
      />
    </div>
  );
}
