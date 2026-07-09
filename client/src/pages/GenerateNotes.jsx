import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FiMic, 
  FiMicOff,
  FiVolume2, 
  FiVolumeX, 
  FiCopy, 
  FiCheck, 
  FiDownload, 
  FiPrinter, 
  FiArrowLeft,
  FiFolderPlus,
  FiUploadCloud,
  FiFileText,
  FiAward
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { generateAINotes } from '../utils/ai';
import { downloadAsPDF, printNoteToPDF } from '../utils/pdfGenerator';
import { speakText, stopSpeaking, isSpeaking } from '../services/voice';
import { createSpeechRecognizer } from '../services/voice';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import Toast from '../components/Toast';

export default function GenerateNotes() {
  const { subjects, addSubject, addNote } = useNotes();
  const { user, fetchProfile, upgradeUser, updateCreditsRemaining } = useAuth();
  const navigate = useNavigate();

  // Settings states
  const [genMode, setGenMode] = useState('topic'); // 'topic' or 'pdf'
  const [selectedFile, setSelectedFile] = useState(null);
  const [subject, setSubject] = useState(subjects[0] || 'General');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [length, setLength] = useState('Medium');
  const [outputStyle, setOutputStyle] = useState('Bullet Points');
  const [language, setLanguage] = useState('English');
  const [extraInstructions, setExtraInstructions] = useState('');

  // UI state managers
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Toast notifications
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // SaaS Upgrade states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  // Speech Recognition engine
  const [recognizer, setRecognizer] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      triggerToast('Payment successful! Your account has been upgraded.', 'success');
      fetchProfile();
      // Clean up URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Stop speaking when leaving the page
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    const rec = createSpeechRecognizer(
      (text) => {
        setExtraInstructions((prev) => (prev ? `${prev} ${text}` : text));
        triggerToast('Dictation captured successfully!', 'success');
      },
      (error) => {
        console.error('STT Error:', error);
        triggerToast(`Speech recognition error: ${error}`, 'error');
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
    setRecognizer(rec);
  }, []);

  const handleToggleListening = () => {
    if (!recognizer) {
      triggerToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }
    if (isListening) {
      recognizer.stop();
    } else {
      setIsListening(true);
      recognizer.start();
      triggerToast('Listening... Speak instructions now.', 'info');
    }
  };

  const handleAddSubjectSubmit = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const added = addSubject(newSubjectName);
    if (added) {
      setSubject(newSubjectName.trim());
      setNewSubjectName('');
      setShowAddSubject(false);
      triggerToast(`Subject "${newSubjectName}" added successfully.`);
    } else {
      triggerToast('Subject already exists or is invalid.', 'error');
    }
  };

  // Generation handler
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (genMode === 'topic' && !topic.trim()) {
      triggerToast('Please specify a topic or keyword.', 'error');
      return;
    }
    if (genMode === 'pdf' && !selectedFile) {
      triggerToast('Please select/upload a PDF file.', 'error');
      return;
    }

    if (user && !user.isPremium && user.credits <= 0) {
      setShowUpgradeModal(true);
      triggerToast('You have run out of free notes credits. Please upgrade!', 'error');
      return;
    }

    setIsGenerating(true);
    setGeneratedNote(null);
    stopSpeaking();
    setSpeaking(false);

    // Dynamic step messages for realistic UX
    const steps = genMode === 'pdf' ? [
      'Uploading PDF document...',
      'Extracting text content...',
      'Structuring study outline...',
      'Synthesizing core explanations...',
      'Compiling flashcards and review quizzes...',
    ] : [
      'Connecting to AI API Service...',
      'Structuring study outline...',
      'Synthesizing core explanations...',
      'Drafting real-world cases...',
      'Compiling flashcards and review quizzes...',
    ];

    let currentStep = 0;
    setLoadingStep(steps[currentStep]);
    const stepTimer = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStep(steps[currentStep]);
      }
    }, 2500);

    try {
      const result = await generateAINotes({
        subject,
        topic: genMode === 'pdf' ? selectedFile.name.replace(/\.[^/.]+$/, "") : topic,
        difficulty,
        length,
        style: outputStyle,
        language,
        extra: extraInstructions,
        file: genMode === 'pdf' ? selectedFile : null,
      });

      clearInterval(stepTimer);

      // Save generated notes to context
      const savedNote = await addNote({
        title: result.title || (genMode === 'pdf' ? selectedFile.name.replace(/\.[^/.]+$/, "") : topic),
        subject,
        topic: genMode === 'pdf' ? selectedFile.name.replace(/\.[^/.]+$/, "") : topic,
        difficulty,
        length,
        style: outputStyle,
        language,
        content: result.content,
        flashcards: result.flashcards || [],
        quiz: result.quiz || [],
      });

      if (result.creditsRemaining !== undefined) {
        updateCreditsRemaining(result.creditsRemaining);
      }

      setGeneratedNote(savedNote);
      triggerToast('Student notes generated and saved to My Notes!');
    } catch (err) {
      clearInterval(stepTimer);
      console.error(err);
      if (err.response?.status === 403 || err.message?.includes('OUT_OF_CREDITS')) {
        setShowUpgradeModal(true);
        triggerToast('No credits remaining. Upgrade to Premium to continue!', 'error');
      } else {
        triggerToast(err.message || 'Notes generation failed.', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // TTS Read Aloud toggles
  const handleToggleReadAloud = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakText(
        generatedNote.content,
        null,
        () => setSpeaking(false)
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedNote.content);
    setCopied(true);
    triggerToast('Copied notes to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 relative z-10">
      
      {/* Title */}
      <div className="flex items-center gap-4">
        {generatedNote && (
          <button
            onClick={() => setGeneratedNote(null)}
            className="p-2.5 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 cursor-pointer"
            title="Configure New Note"
          >
            <FiArrowLeft />
          </button>
        )}
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-gray-950 to-gray-700 dark:from-white dark:to-gray-400">
            AI Notes Generator
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1.5">
            <p className="text-xs md:text-sm text-gray-500">Specify parameters to synthesize clean, well-formatted student revision guides.</p>
            {user && (
              <span className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                user.isPremium 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'bg-violet-500/10 text-[rgb(var(--accent-color))] border border-violet-500/20'
              }`}>
                {user.isPremium ? 'Premium (Unlimited)' : `${user.credits} Free Credits Remaining`}
              </span>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Loading Spinner Scene */}
        {isGenerating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel border border-gray-200/10 p-12 rounded-3xl text-center space-y-6 max-w-md mx-auto"
          >
            <LoadingSpinner size="lg" />
            <div className="space-y-2">
              <h3 className="font-display font-bold text-base">Synthesizing Notes</h3>
              <p className="text-xs text-gray-500 animate-pulse">{loadingStep}</p>
            </div>
            <p className="text-xxs text-gray-400 leading-normal">
              This could take up to 10 seconds as our AI structures, expands, and generates study guides.
            </p>
          </motion.div>
        )}

        {/* Note Configuration Input Forms */}
        {!isGenerating && !generatedNote && (
          <motion.div
            key="config-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            
            {/* Form Column */}
            <form onSubmit={handleGenerate} className="md:col-span-2 glass-panel border border-gray-200/10 p-6 rounded-3xl space-y-5 text-left">
              <h3 className="font-display font-bold text-base border-b border-gray-200/10 pb-3 flex items-center gap-2">
                <HiSparkles className="text-[rgb(var(--accent-color))]" /> Setup Parameters
              </h3>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 gap-2 border border-gray-200/20 p-1 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                <button
                  type="button"
                  onClick={() => { setGenMode('topic'); setSelectedFile(null); }}
                  className={`py-2 text-xxs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    genMode === 'topic'
                      ? 'bg-[rgb(var(--accent-color))] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <HiSparkles className="text-xs" /> Topic / Keyword
                </button>
                <button
                  type="button"
                  onClick={() => { setGenMode('pdf'); setTopic(''); }}
                  className={`py-2 text-xxs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    genMode === 'pdf'
                      ? 'bg-[rgb(var(--accent-color))] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <FiUploadCloud className="text-xs" /> Upload PDF Material
                </button>
              </div>

              {/* Subject Select Row */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Subject</label>
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(!showAddSubject)}
                    className="text-xxs font-bold text-[rgb(var(--accent-color))] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FiFolderPlus /> {showAddSubject ? 'Cancel' : 'Add Subject'}
                  </button>
                </div>

                {!showAddSubject ? (
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 outline-hidden focus:border-[rgb(var(--accent-color))] cursor-pointer font-semibold"
                  >
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new subject name..."
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="flex-grow text-xs px-3.5 py-2 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddSubjectSubmit}
                      className="px-4 py-2 text-xs font-bold text-white bg-[rgb(var(--accent-color))] rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Conditional Inputs based on genMode */}
              {genMode === 'topic' ? (
                /* Topic Input */
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Topic / Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. Photosynthesis, Binary Search Trees, French Grammar"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 outline-hidden focus:border-[rgb(var(--accent-color))] font-semibold"
                    required
                  />
                </div>
              ) : (
                /* PDF File Upload Zone */
                <div className="space-y-2">
                  <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Upload Study Document (PDF)</label>
                  <div className="border-2 border-dashed border-gray-200/20 hover:border-[rgb(var(--accent-color))]/50 rounded-2xl p-6 transition-all bg-gray-50/20 dark:bg-gray-900/10 hover:bg-gray-50/40 dark:hover:bg-gray-900/20 text-center relative flex flex-col items-center justify-center min-h-[140px] cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.type === 'application/pdf') {
                          setSelectedFile(file);
                          triggerToast(`Selected: ${file.name}`);
                        } else if (file) {
                          triggerToast('Please select a valid PDF file.', 'error');
                        }
                      }}
                    />
                    {!selectedFile ? (
                      <div className="space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                          <FiUploadCloud className="text-lg" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Drag and drop your PDF here, or click to browse</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Supports PDF documents up to 10MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <FiFileText className="text-lg animate-bounce" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[280px]">{selectedFile.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          className="px-3 py-1.5 text-[10px] font-bold text-rose-500 hover:text-white border border-rose-500 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer relative z-10"
                        >
                          Remove File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Difficulty Toggle Group */}
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-3 border border-gray-200/20 p-1.5 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                  {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 text-xxs font-bold rounded-lg cursor-pointer transition-all ${
                        difficulty === diff 
                          ? 'bg-[rgb(var(--accent-color))] text-white shadow-xs' 
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>              {/* Note Length & Language Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Note length */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Note Length</label>
                  <div className="grid grid-cols-3 gap-2 border border-gray-200/20 p-1 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                    {['Short', 'Medium', 'Detailed'].map((len) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => setLength(len)}
                        className={`py-1.5 text-xxs font-bold rounded-lg cursor-pointer transition-all ${
                          length === len 
                            ? 'bg-[rgb(var(--accent-color))] text-white shadow-xs' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 outline-hidden cursor-pointer font-semibold"
                  >
                    <option value="English">English</option>
                    <option value="French">French (Français)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                  </select>
                </div>
              </div>

              {/* Generate button */}
              <button
                type="submit"
                className="w-full py-3.5 text-sm font-bold text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] rounded-xl transition-all shadow-lg hover:scale-101 cursor-pointer flex items-center justify-center gap-2"
              >
                <HiSparkles className="animate-pulse" /> Generate Study Notes
              </button>
            </form>

            {/* Guidelines Card column */}
            <div className="space-y-6">
              <div className="glass-panel border border-gray-200/10 p-6 rounded-3xl text-left space-y-4">
                <h4 className="font-display font-bold text-sm text-gray-800 dark:text-white">Note Template Standards</h4>
                <ul className="text-xxs text-gray-500 dark:text-gray-400 space-y-2.5 list-disc pl-4">
                  <li>**Well Structured**: Organizes content using clear headers and definitions.</li>
                  <li>**Practical Walkthroughs**: Adds examples, code segments, or formulas.</li>
                  <li>**Revision Checkpoints**: Highlights common mistakes and provides exam preparation tips.</li>
                  <li>**Multi-format Export**: Instantly export summaries as MD, TXT, or download as printed PDFs.</li>
                </ul>
              </div>
            </div>

          </motion.div>
        )}

        {/* Note Viewer Screen */}
        {generatedNote && (
          <motion.div
            key="notes-viewer"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            {/* Note Markdown container */}
            <div className="lg:col-span-3 glass-panel border border-gray-200/10 p-6 sm:p-8 rounded-3xl text-left min-h-[500px]">
              <MarkdownRenderer content={generatedNote.content} />
            </div>

            {/* Sidebar quick actions panels */}
            <div className="space-y-6">
              <div className="glass-panel border border-gray-200/10 p-5 rounded-2xl text-left space-y-4">
                <h4 className="font-display font-bold text-sm text-gray-800 dark:text-white border-b border-gray-200/10 pb-2">
                  Document Actions
                </h4>

                <div className="flex flex-col gap-2.5">
                  {/* TTS Voice Read button */}
                  <button
                    onClick={handleToggleReadAloud}
                    className={`flex items-center gap-2.5 w-full text-xs font-semibold px-4 py-3 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                      speaking ? 'text-amber-500 border-amber-500/20' : ''
                    }`}
                  >
                    {speaking ? <FiVolumeX /> : <FiVolume2 />}
                    {speaking ? 'Stop Reading Aloud' : 'Listen (Text-to-Speech)'}
                  </button>

                  {/* Copy clipboard */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2.5 w-full text-xs font-semibold px-4 py-3 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                    Copy Markdown
                  </button>

                  {/* Print to PDF */}
                  <button
                    onClick={() => printNoteToPDF(generatedNote)}
                    className="flex items-center gap-2.5 w-full text-xs font-semibold px-4 py-3 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <FiPrinter /> Print Note
                  </button>

                  {/* Download PDF */}
                  <button
                    onClick={() => downloadAsPDF(generatedNote)}
                    className="flex items-center gap-2.5 w-full text-xs font-bold px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer shadow-md"
                  >
                    <FiDownload /> Download as PDF (.pdf)
                  </button>


                </div>
              </div>

              {/* Study links */}
              <div className="glass-panel border border-gray-200/10 p-5 rounded-2xl text-left space-y-3">
                <h4 className="font-display font-bold text-xs text-gray-400 uppercase tracking-wider">
                  Test and Revise
                </h4>
                
                <button
                  onClick={() => navigate(`/dashboard/flashcards?id=${generatedNote.id}`)}
                  className="w-full py-2.5 text-xs font-bold text-white bg-violet-500/90 hover:bg-violet-600 rounded-xl transition-all shadow-xs cursor-pointer text-center block"
                >
                  Study Flashcards
                </button>

                <button
                  onClick={() => navigate(`/dashboard/quiz?id=${generatedNote.id}`)}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-500/90 hover:bg-emerald-600 rounded-xl transition-all shadow-xs cursor-pointer text-center block"
                >
                  Take Practice Quiz
                </button>
              </div>

              {/* Done button */}
              <button
                onClick={() => navigate('/dashboard/notes')}
                className="w-full py-3.5 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-center"
              >
                View in My Notes
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* SaaS Premium Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-slate-955/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="glass-panel border border-white/10 w-full max-w-md p-6 sm:p-8 rounded-3xl relative z-10 text-left bg-gradient-to-b from-slate-900 via-slate-900 to-black text-white shadow-2xl"
            >
              <div className="text-center space-y-4">
                {/* Premium Badge */}
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-inner animate-pulse-slow">
                  <FiAward />
                </div>
                
                <h3 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight">Upgrade to Premium 👑</h3>
                <p className="text-xs text-gray-400">You have exhausted your free trial notes. Unlock full access to continue your academic success.</p>
                
                {/* Features List */}
                <div className="py-4 space-y-3 text-left">
                  {[
                    'Unlimited study guides and revisions notes',
                    'Scan unlimited PDF documents and slides',
                    'Access full custom flashcards and test quizzes',
                    'Interactive dashboard metrics tracking',
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-xxs font-semibold text-gray-300">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[8px]">✓</div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Real Checkout Button */}
                <button
                  disabled={isUpgrading}
                  onClick={async () => {
                    setIsUpgrading(true);
                    try {
                      const response = await axios.post('/api/create-checkout-session');
                      if (response.data.url) {
                        window.location.href = response.data.url;
                      } else {
                        throw new Error('Failed to create checkout session.');
                      }
                    } catch (err) {
                      console.error('Checkout error:', err);
                      triggerToast('Failed to connect to checkout. Is the server configured correctly?', 'error');
                      setIsUpgrading(false);
                    }
                  }}
                  className={`w-full py-4 text-xs font-bold text-slate-950 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    isUpgrading 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                  }`}
                >
                  {isUpgrading ? 'Redirecting to secure checkout...' : 'Upgrade to Premium (Secure Checkout) 💳'}
                </button>

                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full text-xxs text-gray-500 hover:text-gray-300 transition-colors py-1 cursor-pointer font-bold uppercase tracking-wider"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating alerts */}
      <Toast
        show={toastShow}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastShow(false)}
      />
    </div>
  );
}
