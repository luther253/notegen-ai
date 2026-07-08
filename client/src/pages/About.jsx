import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronRight, FiLayers, FiCheckSquare, FiAward, FiBookOpen, FiArrowRight, FiX, FiCheck } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

export default function About() {
  const workflowSteps = [
    {
      title: '1. Connect Your AI API Key',
      desc: 'Configure your Gemini or OpenAI API Key securely in Settings. Keys are stored locally in your browser cache.',
      icon: HiSparkles,
    },
    {
      title: '2. Generate Custom Notes',
      desc: 'Enter subject, topic, and choose detailed formatting filters. The AI outputs structured explanations with tips.',
      icon: FiAward,
    },
    {
      title: '3. Flip Flashcards',
      desc: 'Let the AI convert notes into quiz cards instantly. Review answers to test active recall.',
      icon: FiLayers,
    },
    {
      title: '4. Take Quizzes',
      desc: 'Test your retention with generated MCQs, True/False, and short-answer prompts. Check scores and retry anytime.',
      icon: FiCheckSquare,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 relative z-10 text-center space-y-16">
      {/* Intro Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-4"
      >
        <span className="text-xxs font-bold text-[rgb(var(--accent-color))] uppercase tracking-wider bg-violet-500/10 px-2.5 py-1 rounded-full">
          The Science of Learning
        </span>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
          Supercharge Your Learning Loop
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
          Our application bridges the gap between passive reading and active study using state-of-the-art LLMs.
        </p>
      </motion.div>

      {/* Active vs Passive Learning Visualizer */}
      <motion.div
        initial={{ y: 25, opacity: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
      >
        {/* Passive card */}
        <div className="glass-panel border border-gray-200/10 p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-rose-500/[0.02] to-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center text-sm font-extrabold">
              <FiX />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white">Passive Study</h3>
              <p className="text-[10px] text-gray-400">Highlighting & Re-reading</p>
            </div>
          </div>
          <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-500 font-display">15%</span>
              <span className="font-semibold text-xxs uppercase tracking-wider text-gray-400">Retention Rate</span>
            </div>
            <p className="leading-relaxed">Simply reading summaries or highlighting textbook lines feels productive, but it creates an **illusion of competence**—you recognize the text, but your brain hasn't learned to retrieve it.</p>
          </div>
        </div>

        {/* Active card */}
        <div className="glass-panel border border-gray-200/10 p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.02] to-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-extrabold">
              <FiCheck />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white">Active Recall</h3>
              <p className="text-[10px] text-gray-400">Generating & Retrieving (Notegen.ai)</p>
            </div>
          </div>
          <div className="space-y-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-500 font-display">85%</span>
              <span className="font-semibold text-xxs uppercase tracking-wider text-gray-400">Retention Rate</span>
            </div>
            <p className="leading-relaxed">When you generate customized notes, test your comprehension with flashcards, and practice quiz sets, you force your brain to build strong, durable **neural retrieval pathways**.</p>
          </div>
        </div>
      </motion.div>

      {/* App Philosophy Callout */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel border border-gray-200/10 p-8 rounded-3xl text-left shadow-xs bg-gradient-to-tr from-violet-500/5 to-indigo-500/5"
      >
        <h2 className="font-display font-bold text-lg mb-3 text-gray-900 dark:text-white">
          Why We Built Notegen.ai 🚀
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
          We wanted to build an academic companion that doesn't just act as another bookmarking tool. Notegen.ai converts passive summaries into **actionable study decks**.
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          By integrating customizable note generation with interactive quizzes and flashcards (all securely synced to your personal cloud database), you have a complete, secure revision workspace in one single tab.
        </p>
      </motion.div>

      {/* Step by Step Workflow */}
      <div className="space-y-8">
        <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white">
          How to Use the App
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="glass-panel border border-gray-200/10 p-6 rounded-2xl text-left flex items-start gap-4 hover:border-[rgb(var(--accent-color))]/20 transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-violet-500/10 text-[rgb(var(--accent-color))] text-xl flex-shrink-0">
                  <Icon />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm mb-1 text-gray-900 dark:text-white">
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Button link */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-6 py-3.5 text-sm font-bold text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] rounded-xl transition-all shadow-md hover:scale-102 cursor-pointer"
        >
          Go to Study Dashboard <FiChevronRight />
        </Link>
      </motion.div>
    </div>
  );
}
