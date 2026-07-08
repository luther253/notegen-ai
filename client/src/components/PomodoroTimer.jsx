import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiPause, FiRefreshCw, FiSettings, FiMinus } from 'react-icons/fi';

const MODES = {
  work:       { label: 'Focus',       defaultMin: 25, color: '#8b5cf6', bg: 'from-violet-500/20 to-indigo-500/10' },
  shortBreak: { label: 'Short Break', defaultMin: 5,  color: '#10b981', bg: 'from-emerald-500/20 to-teal-500/10' },
  longBreak:  { label: 'Long Break',  defaultMin: 15, color: '#3b82f6', bg: 'from-blue-500/20 to-cyan-500/10'   },
};

// Play a soft beep using Web Audio API — no external file needed
function playBeep(times = 2, frequency = 660) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
      gain.gain.linearRampToValueAtTime(0, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.5);
      t += 0.6;
    }
  } catch (_) { /* Audio not supported */ }
}

// SVG Circular progress ring
function TimerRing({ progress, color, size = 160, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
      />
    </svg>
  );
}

export default function PomodoroTimer() {
  const [config, setConfig] = useState({ work: 25, shortBreak: 5, longBreak: 15 });
  const [mode, setMode] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempConfig, setTempConfig] = useState({ work: 25, shortBreak: 5, longBreak: 15 });

  const intervalRef = useRef(null);
  const modeRef = useRef(mode);
  const sessionsRef = useRef(sessions);
  modeRef.current = mode;
  sessionsRef.current = sessions;

  const totalSeconds = config[mode] * 60;

  useEffect(() => {
    setSecondsLeft(config[mode] * 60);
    setRunning(false);
  }, [mode, config]);

  const handleTimerEnd = useCallback(() => {
    setRunning(false);
    const currentMode = modeRef.current;
    playBeep(3, currentMode === 'work' ? 880 : 523);
    if (currentMode === 'work') {
      setSessions(prev => {
        const newSessions = prev + 1;
        sessionsRef.current = newSessions;
        setMode(newSessions % 4 === 0 ? 'longBreak' : 'shortBreak');
        return newSessions;
      });
    } else {
      setMode('work');
    }
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, handleTimerEnd]);

  const handleReset = () => {
    setRunning(false);
    setSecondsLeft(config[mode] * 60);
  };

  const handleModeSwitch = (m) => {
    setRunning(false);
    setMode(m);
  };

  const applySettings = () => {
    setConfig(tempConfig);
    setShowSettings(false);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const { color, bg } = MODES[mode];

  return (
    <>
      {/* Minimized FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setIsOpen(true)}
            title="Open Pomodoro Timer"
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#0f1220]/90 backdrop-blur-md border border-white/10 shadow-2xl hover:border-violet-500/40 hover:bg-[#12152a]/90 transition-all cursor-pointer"
          >
            <span className="text-base leading-none">🍅</span>
            <span className="font-mono text-sm font-bold text-white tracking-wider">{fmt(secondsLeft)}</span>
            {running && <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />}
            <span className="text-[10px] text-gray-500 font-semibold hidden sm:inline">{MODES[mode].label}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className={`fixed bottom-6 right-6 z-40 w-[320px] rounded-3xl bg-[#0c0e1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden bg-gradient-to-br ${bg}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍅</span>
                <span className="text-xs font-bold text-white">Pomodoro Timer</span>
                <span className="text-[10px] text-gray-500 font-semibold bg-white/5 px-1.5 py-0.5 rounded-md">
                  {sessions % 4}/4
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(s => !s)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Settings"
                >
                  <FiSettings className="text-sm" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <FiMinus className="text-sm" />
                </button>
              </div>
            </div>

            {/* Settings */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden px-5"
                >
                  <div className="py-3 space-y-2.5 border-t border-white/[0.07]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customize Intervals</p>
                    {[['work', 'Focus (min)'], ['shortBreak', 'Short Break (min)'], ['longBreak', 'Long Break (min)']].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-xs text-gray-300 font-medium">{label}</label>
                        <input
                          type="number"
                          min={1} max={90}
                          value={tempConfig[key]}
                          onChange={e => setTempConfig(prev => ({ ...prev, [key]: Math.max(1, parseInt(e.target.value) || 1) }))}
                          className="w-16 text-center text-xs font-bold bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-violet-500/60"
                        />
                      </div>
                    ))}
                    <button
                      onClick={applySettings}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer mt-1"
                    >
                      Apply Settings
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode tabs */}
            <div className="flex gap-1 px-5 pt-2 pb-1">
              {Object.entries(MODES).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => handleModeSwitch(key)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    mode === key ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Ring + countdown */}
            <div className="flex flex-col items-center py-4 gap-1 relative">
              <div className="relative">
                <TimerRing progress={progress} color={color} size={160} stroke={8} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-3xl font-extrabold text-white tracking-wider leading-none">
                    {fmt(secondsLeft)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-widest">
                    {MODES[mode].label}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 px-5 pb-4">
              <button
                onClick={handleReset}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Reset timer"
              >
                <FiRefreshCw className="text-sm" />
              </button>
              <button
                onClick={() => setRunning(r => !r)}
                style={{ background: color }}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all cursor-pointer hover:opacity-90 active:scale-95"
              >
                {running ? <FiPause /> : <FiPlay />}
                {running ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => setSessions(0)}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Reset session count"
              >
                <span className="text-sm leading-none">🔄</span>
              </button>
            </div>

            {/* Session dots */}
            <div className="flex items-center justify-center gap-2 pb-5">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i < (sessions % 4) ? 'bg-violet-500' : 'bg-white/10'}`}
                />
              ))}
              <span className="text-[10px] text-gray-500 font-semibold ml-1">{sessions} total</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
