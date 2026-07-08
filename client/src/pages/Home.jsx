import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowRight, 
  FiLayers, 
  FiCheckSquare, 
  FiBook, 
  FiLock,
  FiZap,
  FiChevronDown,
  FiBookOpen,
  FiCpu
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

export default function Home() {
  const [activeTab, setActiveTab] = useState('notes');
  const [faqOpen, setFaqOpen] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  const features = [
    {
      title: 'AI Note Synth',
      desc: 'Specify a subject and topic, and our AI drafts structured notes, equations, and code snippets.',
      icon: HiSparkles,
      color: 'from-violet-500/20 to-purple-500/20 text-violet-500',
    },
    {
      title: 'Spaced Recall Cards',
      desc: 'Convert generated documents into 3D flipping flashcards automatically to verify recall.',
      icon: FiLayers,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-500',
    },
    {
      title: 'Revision Quizzes',
      desc: 'Take instant multiple-choice, true/false, or short-answer exams generated from your content.',
      icon: FiCheckSquare,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500',
    },
  ];

  const faqs = [
    {
      q: 'What is Notegen.ai?',
      a: 'Notegen.ai is an advanced academic study suite that uses Google Gemini and OpenAI to synthesize comprehensive notes, flashcards, and customized exam quizzes instantly.'
    },
    {
      q: 'How does the PDF Upload feature work?',
      a: 'Simply drag and drop your lecture slide, research paper, or textbook PDF. Our server parses the text contents and automatically builds matching notes and mock tests.'
    },
    {
      q: 'Is my personal data secure?',
      a: 'Absolutely. Your notes are saved locally on your browser and synced securely to your own private MongoDB Atlas cloud database. We do not store or track your files on our servers.'
    },
    {
      q: 'How do I configure my own AI keys?',
      a: 'You can use our high-quality default mock server, or go to the Settings page and paste your Google Gemini or OpenAI API keys to generate custom notes directly using your own AI balance.'
    }
  ];

  const toggleFaq = (idx) => {
    setFaqOpen(faqOpen === idx ? null : idx);
  };

  return (
    <div className="relative z-10 space-y-16 pb-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center flex flex-col items-center">
        {/* Floating AI pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-xs font-semibold text-[rgb(var(--accent-color))] mb-8 shadow-xs"
        >
          <FiZap className="animate-pulse text-yellow-500" /> Supercharge Your Studies
        </motion.div>

        {/* Hero Headers */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight leading-tight max-w-4xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white"
        >
          Study Smarter, Not Harder With{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[rgb(var(--accent-color))] to-violet-400">
            AI Notes
          </span>
        </motion.h1>

        {/* Hero description */}
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-gray-500 dark:text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
        >
          Generate comprehensive study guides, customize structures, build smart flashcards, and take quizzes—all in one place. Secured with MongoDB Atlas.
        </motion.p>

        {/* Call to action */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-7 py-4 text-base font-bold rounded-2xl text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] transition-all shadow-lg hover:scale-102 cursor-pointer"
          >
            Start Generating Free <FiArrowRight />
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2 px-7 py-4 text-base font-bold rounded-2xl border border-gray-300/30 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all hover:scale-102 cursor-pointer"
          >
            Learn How It Works
          </Link>
        </motion.div>
      </section>

      {/* Interactive App Workspace Simulator (Preview) */}
      <section className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel border border-gray-200/10 rounded-3xl overflow-hidden shadow-2xl bg-slate-900/60 dark:bg-black/50"
        >
          {/* Simulator Bar */}
          <div className="border-b border-white/5 bg-white/5 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xxs font-bold text-gray-500 tracking-widest uppercase">Workspace Simulator</span>
            <div className="w-12 h-1 bg-transparent" />
          </div>

          {/* Simulator Tabs */}
          <div className="flex border-b border-white/5 bg-white/[0.02] text-xxs font-bold text-gray-400">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-b-2 ${
                activeTab === 'notes' ? 'text-white border-[rgb(var(--accent-color))] bg-white/5' : 'border-transparent hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <FiBook className="text-xs" /> Study Notes
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-b-2 ${
                activeTab === 'flashcards' ? 'text-white border-[rgb(var(--accent-color))] bg-white/5' : 'border-transparent hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <FiLayers className="text-xs" /> Spaced Cards
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-b-2 ${
                activeTab === 'quiz' ? 'text-white border-[rgb(var(--accent-color))] bg-white/5' : 'border-transparent hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <FiCheckSquare className="text-xs" /> Revision Quiz
            </button>
          </div>

          {/* Simulator Content Area */}
          <div className="p-6 sm:p-8 min-h-[220px] text-left text-xs text-gray-300">
            <AnimatePresence mode="wait">
              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4 font-sans"
                >
                  <h3 className="text-base font-extrabold text-white"># Database Management Systems (DBMS) 🗄️</h3>
                  <p className="leading-relaxed">A **DBMS** acts as an interface between users and the database, ensuring that data is organized, secure, and easy to access.</p>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <span className="font-bold text-violet-400">Key Concept</span>: Reduces data redundancy and improves consistency.
                  </div>
                  <pre className="p-3 bg-black/40 rounded-xl font-mono text-[11px] text-emerald-400 border border-white/5 overflow-x-auto">
                    {`SELECT * FROM Students WHERE Course = 'Computer Science';`}
                  </pre>
                </motion.div>
              )}

              {activeTab === 'flashcards' && (
                <motion.div
                  key="flashcards"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-4"
                >
                  <div className="w-full max-w-[280px] h-[120px] rounded-2xl border border-white/10 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex flex-col justify-between p-4 shadow-lg relative overflow-hidden cursor-pointer hover:rotate-1 transition-transform">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Flashcard 1 of 5</span>
                    <p className="text-center font-bold text-xs">What is data redundancy?</p>
                    <span className="text-[8px] font-semibold text-center uppercase tracking-wider opacity-80 animate-pulse">Click card to flip</span>
                    {/* Abstract circles */}
                    <div className="absolute right-[-10%] top-[-10%] w-16 h-16 rounded-full bg-white/10" />
                  </div>
                </motion.div>
              )}

              {activeTab === 'quiz' && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Question 1 of 3 (MCQ)</span>
                  <p className="font-bold text-white text-xs">Which of the following is NOT an advantage of a DBMS?</p>
                  <div className="space-y-2">
                    {[
                      { letter: 'A', text: 'Reduces data redundancy', correct: false },
                      { letter: 'B', text: 'Improves data security', correct: false },
                      { letter: 'C', text: 'Requires significant storage', correct: true },
                    ].map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer text-xxs font-semibold ${
                          opt.correct 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' 
                            : 'border-white/5 bg-white/5 hover:bg-white/[0.08]'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold ${opt.correct ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                          {opt.letter}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* Features Showcase */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-16">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Study Tools Designed for Success
          </h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            Discover a clean, modern study suite that provides full control over note formats, revisions, and database settings.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="glass-panel border border-gray-200/10 p-8 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xs"
              >
                {/* Icon box */}
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${feat.color} w-fit mb-6 shadow-sm`}>
                  <Icon className="text-2xl" />
                </div>
                
                <h3 className="font-display font-bold text-lg mb-3 text-gray-900 dark:text-white">
                  {feat.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feat.desc}
                </p>

                {/* Decorative border highlight */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[rgb(var(--accent-color))] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-8 text-left">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-center mb-12 text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div 
                key={idx}
                className="glass-panel border border-gray-200/10 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 flex items-center justify-between gap-4 font-bold text-sm text-gray-800 dark:text-white cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  <FiChevronDown className={`text-base transition-transform duration-300 ${isOpen ? 'rotate-180 text-[rgb(var(--accent-color))]' : 'text-gray-400'}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs text-gray-500 dark:text-gray-400 border-t border-white/5 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Privacy Feature section */}
      <section className="max-w-4xl mx-auto px-6 py-4 text-center">
        <div className="glass-card border border-gray-200/10 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 text-left">
          <div className="p-4.5 rounded-2xl bg-violet-500/10 text-[rgb(var(--accent-color))] text-3xl">
            <FiLock />
          </div>
          <div>
            <h4 className="font-display font-bold text-lg mb-1.5 text-gray-900 dark:text-white">
              Private Atlas Cloud Sync
            </h4>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We sync your study revision notes, quizzes, and flashcard metrics directly to your private MongoDB Atlas cluster. Authenticated with secure passwords and JWT token access.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
