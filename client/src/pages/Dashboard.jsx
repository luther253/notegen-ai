import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiLayers, 
  FiCheckSquare, 
  FiFolder, 
  FiHeart, 
  FiBook, 
  FiClock, 
  FiArrowRight, 
  FiAward 
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useNotes } from '../context/NotesContext';

export default function Dashboard() {
  const { notes, subjects, quizzes } = useNotes();
  const navigate = useNavigate();

  const [userName, setUserName] = useState('Student');
  const [userUni, setUserUni] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('notes_user_name');
    const savedUni = localStorage.getItem('notes_user_uni');
    if (savedName) setUserName(savedName);
    if (savedUni) setUserUni(savedUni);
  }, []);

  const totalNotes = notes.length;
  const favoriteNotes = notes.filter((n) => n.isFavorite).length;
  const recentNotes = notes.slice(0, 3);
  const favoriteList = notes.filter((n) => n.isFavorite).slice(0, 3);

  // Dynamic database statistics computations
  const avgScore = quizzes.length > 0
    ? Math.round((quizzes.reduce((acc, q) => acc + (q.score / q.maxScore), 0) / quizzes.length) * 100)
    : 0;

  const totalXP = notes.length * 100 + quizzes.length * 150 + notes.filter(n => n.isFavorite).length * 50;
  const studyLevel = Math.floor(totalXP / 500) + 1;
  const levelXPProgress = totalXP % 500;
  const xpPercentage = Math.round((levelXPProgress / 500) * 100);

  const getLevelTitle = (lvl) => {
    if (lvl === 1) return 'Revision Novice';
    if (lvl === 2) return 'Study Apprentice';
    if (lvl === 3) return 'Focused Learner';
    if (lvl === 4) return 'Exam Scholar';
    return 'Academic Legend';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  const statCards = [
    { label: 'Total Notes', count: totalNotes, icon: FiBook, color: 'text-violet-500 bg-violet-500/10' },
    { label: 'Favorites', count: favoriteNotes, icon: FiHeart, color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Subjects', count: subjects.length, icon: FiFolder, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Quizzes Taken', count: quizzes.length, icon: FiAward, color: 'text-emerald-500 bg-emerald-500/10' },
  ];

  const quickActions = [
    { title: 'Generate Notes', desc: 'Synthesize details with AI', path: '/dashboard/generate', icon: HiSparkles, color: 'bg-violet-500' },
    { title: 'Study Flashcards', desc: 'Revise with flip cards', path: '/dashboard/flashcards', icon: FiLayers, color: 'bg-blue-500' },
    { title: 'Take a Quiz', desc: 'Test content comprehension', path: '/dashboard/quiz', icon: FiCheckSquare, color: 'bg-emerald-500' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 relative z-10"
    >
      {/* Welcome Card Banner */}
      <motion.div
        variants={itemVariants}
        className="glass-panel border border-gray-200/10 p-6 sm:p-8 rounded-3xl relative overflow-hidden bg-gradient-to-r from-violet-500/10 to-indigo-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="relative z-10 max-w-xl text-left">
          <span className="text-xxs font-bold text-[rgb(var(--accent-color))] uppercase tracking-wider bg-violet-500/10 px-2.5 py-1 rounded-full">
            Active Study Workspace
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-3 text-gray-900 dark:text-white">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            {userUni ? `Student at ${userUni}. ` : ''}
            Ready to generate new custom notes or test your recollection? Pick a study module below to begin.
          </p>
        </div>

        {/* Gamified Level Card */}
        <div className="relative z-10 w-full md:w-64 p-4.5 rounded-2xl bg-white/5 dark:bg-black/20 border border-white/10 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xxs font-bold uppercase tracking-wider">
            <span className="text-violet-400">Level {studyLevel}: {getLevelTitle(studyLevel)}</span>
            <span className="text-gray-400">{levelXPProgress}/500 XP</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 text-left font-semibold">
            Generate more notes (+100 XP) and ace quizzes (+150 XP) to rank up!
          </span>
        </div>
        
        {/* Floating background graphic */}
        <div className="absolute right-6 bottom-[-20%] opacity-10 pointer-events-none hidden md:block">
          <HiSparkles className="text-[180px] text-[rgb(var(--accent-color))] animate-pulse-slow" />
        </div>
      </motion.div>

      {/* Grid Stats Row */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="glass-panel border border-gray-200/10 p-5 rounded-2xl flex items-center gap-4 hover:border-gray-200/20 transition-all shadow-xs"
            >
              <div className={`p-3 rounded-xl ${stat.color} flex-shrink-0 text-lg`}>
                <Icon />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider leading-none">
                  {stat.label}
                </p>
                <p className="text-xl font-bold mt-1 font-display leading-tight">{stat.count}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Quick Action Grid */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-base text-left text-gray-800 dark:text-white">
          Study Modules
        </h2>
        <motion.div 
          variants={itemVariants} 
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {quickActions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <Link
                key={idx}
                to={act.path}
                className="glass-panel border border-gray-200/10 p-6 rounded-2xl flex flex-col justify-between group hover:border-[rgb(var(--accent-color))]/20 transition-all duration-300 shadow-xs cursor-pointer text-left"
              >
                <div className={`p-3.5 rounded-xl ${act.color} text-white w-fit shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="text-lg" />
                </div>
                <div className="mt-6">
                  <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1 group-hover:text-[rgb(var(--accent-color))] transition-colors">
                    {act.title} <FiArrowRight className="text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-xxs text-gray-400 mt-1">{act.desc}</p>
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>

      {/* Analytics & Streak Panels */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Average Quiz Score Widget */}
        <div className="glass-panel border border-gray-200/10 p-6 rounded-2xl flex flex-col justify-between text-left h-44 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <div>
            <h3 className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Average Quiz Score</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-normal">Your overall comprehension index based on examinations.</p>
          </div>
          <div className="flex items-baseline gap-2 mt-4 z-10">
            <span className="text-3xl font-extrabold font-display text-emerald-500">{avgScore}%</span>
            <span className="text-xxs text-gray-400 font-semibold">accuracy score</span>
          </div>
          <div className="absolute right-[-10%] bottom-[-10%] w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
        </div>

        {/* Study Consistency Streak */}
        <div className="glass-panel border border-gray-200/10 p-6 rounded-2xl flex flex-col justify-between text-left h-44 md:col-span-2 bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
          <div>
            <h3 className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Weekly Study Streak</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-normal">Keep up your momentum! Check-in daily to maintain your study streak.</p>
          </div>
          <div className="flex justify-between items-center gap-2 mt-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const currentDay = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
              const isToday = currentDay === (idx === 6 ? 0 : idx + 1);
              const isPassed = (idx === 6 ? 0 : idx + 1) < currentDay;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xxs border transition-all ${
                    isToday 
                      ? 'bg-[rgb(var(--accent-color))] text-white border-[rgb(var(--accent-color))] shadow-md' 
                      : isPassed
                        ? 'bg-violet-500/20 text-violet-400 border-violet-500/10'
                        : 'bg-white/5 text-gray-400 border-gray-200/5'
                  }`}>
                    {idx === 0 ? 'M' : idx === 1 ? 'T' : idx === 2 ? 'W' : idx === 3 ? 'T' : idx === 4 ? 'F' : idx === 5 ? 'S' : 'S'}
                  </div>
                  <span className="text-[9px] text-gray-500 font-semibold">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Grid: Recent and Bookmarked Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Recent Notes History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-gray-800 dark:text-white">
              Recent Activity
            </h2>
            <Link 
              to="/dashboard/notes" 
              className="text-xs font-semibold text-[rgb(var(--accent-color))] hover:underline flex items-center gap-1"
            >
              View all <FiArrowRight />
            </Link>
          </div>

          <motion.div variants={itemVariants} className="space-y-4">
            {recentNotes.length === 0 ? (
              <div className="glass-panel border border-gray-200/10 p-10 rounded-2xl text-center text-gray-400">
                <FiBook className="mx-auto text-3xl mb-2 opacity-40" />
                <p className="text-sm font-semibold">No notes created yet</p>
                <p className="text-xs text-gray-500 mt-1">Use Notes Generator to create your first study guide!</p>
              </div>
            ) : (
              recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate(`/dashboard/notes?id=${note.id}`)}
                  className="glass-panel border border-gray-200/10 hover:border-gray-200/20 p-4.5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:bg-white dark:hover:bg-gray-900/30 transition-all text-left shadow-xs"
                >
                  <div className="min-w-0">
                    <span className="text-xxs font-bold text-[rgb(var(--accent-color))] bg-violet-500/10 px-2 py-0.5 rounded-md">
                      {note.subject}
                    </span>
                    <h3 className="font-display font-bold text-sm text-gray-800 dark:text-white truncate mt-2 group-hover:text-[rgb(var(--accent-color))]">
                      {note.title}
                    </h3>
                    <p className="text-xxs text-gray-400 truncate mt-1">{note.topic}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xxs text-gray-400 font-semibold flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <FiClock /> {note.readingTime} min
                    </span>
                    <span className="hidden sm:inline">
                      {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {note.isFavorite && <FiHeart className="text-rose-500 fill-rose-500" />}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </div>

        {/* Right Side: Favorites Bookmarks */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-base text-left text-gray-800 dark:text-white">
            Bookmarked Notes
          </h2>
          
          <motion.div variants={itemVariants} className="space-y-4">
            {favoriteList.length === 0 ? (
              <div className="glass-panel border border-gray-200/10 p-10 rounded-2xl text-center text-gray-400">
                <FiHeart className="mx-auto text-3xl mb-2 opacity-30" />
                <p className="text-sm font-semibold">No favorites yet</p>
                <p className="text-xs text-gray-500 mt-1">Bookmark key notes to find them quickly here.</p>
              </div>
            ) : (
              favoriteList.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate(`/dashboard/notes?id=${note.id}`)}
                  className="glass-panel border border-gray-200/10 p-4 rounded-2xl hover:bg-white dark:hover:bg-gray-900/30 cursor-pointer transition-all text-left shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{note.title}</p>
                    <p className="text-xxs text-gray-400 truncate mt-0.5">{note.subject}</p>
                  </div>
                  <FiHeart className="text-rose-500 fill-rose-500 text-sm flex-shrink-0" />
                </div>
              ))
            )}
          </motion.div>
        </div>

      </div>

    </motion.div>
  );
}
