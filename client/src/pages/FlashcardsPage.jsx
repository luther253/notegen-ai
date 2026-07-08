import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiLayers, 
  FiChevronLeft, 
  FiChevronRight, 
  FiRotateCw, 
  FiShuffle, 
  FiArrowLeft,
  FiBookOpen,
  FiAlertCircle 
} from 'react-icons/fi';
import { useNotes } from '../context/NotesContext';
import Toast from '../components/Toast';

export default function FlashcardsPage() {
  const { notes } = useNotes();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Toast alert
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  // 1. Determine note selection from URL query or default first note
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setSelectedNoteId(id);
    } else if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [location.search, notes]);

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  // 2. Load/Generate Flashcards for the active note
  // Depends only on selectedNoteId — not activeNote (new object ref every render)
  useEffect(() => {
    if (!activeNote) {
      setDeck([]);
      return;
    }

    if (activeNote.flashcards && activeNote.flashcards.length > 0) {
      setDeck(activeNote.flashcards);
    } else {
      // Auto-generate card sets locally if note does not have cards saved
      const localCards = autoGenerateLocalFlashcards(activeNote.content, activeNote.title);
      setDeck(localCards);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId]);

  // Keyboard shortcut listeners (Space, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (deck.length === 0) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deck, currentIndex]);

  // Card list builder parser
  const autoGenerateLocalFlashcards = (text, noteTitle) => {
    const cards = [];
    
    // Parse key-value bullet points or definitions
    const definitionsMatch = [...text.matchAll(/[\*\-]\s+\*\*([^*]+)\*\*:\s*([^\n]+)/g)];
    
    if (definitionsMatch.length > 0) {
      definitionsMatch.slice(0, 6).forEach((match) => {
        cards.push({
          front: `Define: ${match[1].trim()}`,
          back: match[2].trim(),
        });
      });
    }

    // Parse blockquote highlights
    const blockquotesMatch = [...text.matchAll(/^\>\s*(.+)$/gm)];
    if (blockquotesMatch.length > 0) {
      cards.push({
        front: 'What is the core emphasis/quote in this study text?',
        back: blockquotesMatch[0][1].replace(/\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]/i, '').trim(),
      });
    }

    // Default elements based on headings
    const headings = [...text.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
    if (headings.length > 0) {
      headings.slice(0, 3).forEach((h) => {
        cards.push({
          front: `What details are discussed under section "${h}"?`,
          back: `This section explains the methodology, examples, or structures surrounding ${h} for the topic of ${noteTitle}.`
        });
      });
    }

    // Standard card prompts if content is short
    if (cards.length < 3) {
      cards.push(
        { front: `What subject is this note file associated with?`, back: `This study notes set belongs to the subject: ${activeNote?.subject || 'General Studies'}.` },
        { front: `What is the target topic of this study folder?`, back: `The central theme covers: ${activeNote?.topic || 'General Topic'}.` },
        { front: `How would you explain the core concept of ${activeNote?.topic || 'this note'}?`, back: `Refer to the introduction and detailed explanations in your notes file to review this concept.` }
      );
    }

    return cards;
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 0.5 - 0.5); // safe subtraction in JS
      }, 150);
    }
  };

  const handleShuffle = () => {
    if (deck.length === 0) return;
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    triggerToast('Card deck shuffled.');
  };

  const activeCard = deck[currentIndex];
  const progressPercent = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 relative z-10">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          {activeNote && (
            <Link
              to={`/dashboard/notes?id=${activeNote.id}`}
              className="p-2.5 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              title="Back to Note"
            >
              <FiArrowLeft />
            </Link>
          )}
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-gray-950 to-gray-700 dark:from-white dark:to-gray-400">
              Revision Flashcards
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Test active recall by studying flip cards generated from notes.</p>
          </div>
        </div>

        {/* Note selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">Active Note:</span>
          <select
            value={selectedNoteId}
            onChange={(e) => {
              setSelectedNoteId(e.target.value);
              navigate(`/dashboard/flashcards?id=${e.target.value}`);
            }}
            className="text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-white dark:bg-gray-900/40 outline-hidden font-bold cursor-pointer max-w-xs shadow-xs"
          >
            {notes.length === 0 && <option value="">No notes available</option>}
            {notes.map((n) => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        </div>
      </div>

      {deck.length > 0 && activeCard ? (
        <div className="space-y-6">
          
          {/* Progress bar top */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xxs font-bold text-gray-400">
              <span>CARD PROGRESS</span>
              <span>{currentIndex + 1} / {deck.length} CARDS</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[rgb(var(--accent-color))] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3D Flipping Card Frame */}
          <div className="perspective-1000 w-full max-w-xl mx-auto h-80 sm:h-96">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full h-full transform-style-3d transition-transform duration-500 cursor-pointer shadow-lg rounded-3xl border border-gray-200/10 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* CARD FRONT: Question */}
              <div className="absolute inset-0 backface-hidden glass-panel rounded-3xl flex flex-col justify-between p-8 text-center bg-white dark:bg-[#0f1423]">
                <div className="flex items-center justify-between text-xxs font-bold text-gray-400">
                  <span className="flex items-center gap-1"><FiLayers /> FRONT (QUESTION)</span>
                  <span>CLICK TO FLIP</span>
                </div>
                <div className="flex items-center justify-center flex-grow py-4 px-2">
                  <h3 className="font-display font-bold text-base sm:text-xl leading-relaxed text-gray-800 dark:text-gray-200 select-none">
                    {activeCard.front}
                  </h3>
                </div>
                <div className="text-xxs text-gray-400 font-semibold select-none flex items-center justify-center gap-1.5">
                  <FiRotateCw /> click card or press SPACEBAR to reveal answer
                </div>
              </div>

              {/* CARD BACK: Answer */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel rounded-3xl flex flex-col justify-between p-8 text-center bg-gradient-to-tr from-violet-500/5 to-indigo-500/10 dark:from-[#0f1423] dark:to-[#171d33]">
                <div className="flex items-center justify-between text-xxs font-bold text-[rgb(var(--accent-color))]">
                  <span className="flex items-center gap-1"><FiLayers /> BACK (ANSWER)</span>
                  <span>REVEALED</span>
                </div>
                <div className="flex items-center justify-center flex-grow py-4 px-2 overflow-y-auto no-scrollbar">
                  <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700 dark:text-gray-200 select-none font-medium">
                    {activeCard.back}
                  </p>
                </div>
                <div className="text-xxs text-[rgb(var(--accent-color))] font-semibold select-none flex items-center justify-center gap-1.5">
                  <FiRotateCw /> click card or press SPACEBAR to return to question
                </div>
              </div>
            </div>
          </div>

          {/* Navigate & Action buttons */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-3.5 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Card (Left Arrow)"
            >
              <FiChevronLeft className="text-lg" />
            </button>

            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-4.5 py-3 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold cursor-pointer"
              title="Shuffle Deck"
            >
              <FiShuffle /> Shuffle Deck
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === deck.length - 1}
              className="p-3.5 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Card (Right Arrow)"
            >
              <FiChevronRight className="text-lg" />
            </button>
          </div>

          {/* Quick keyboard instruction note */}
          <p className="text-xxs text-gray-400 select-none hidden sm:block">
            Keyboard navigation: use **Left / Right arrow keys** to switch cards. Press **Spacebar** to flip.
          </p>
        </div>
      ) : (
        <div className="glass-panel border border-gray-200/10 p-12 rounded-3xl text-center text-gray-400 max-w-lg mx-auto space-y-4">
          <FiAlertCircle className="mx-auto text-4xl text-gray-500 opacity-60 animate-pulse-slow" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">No active flashcards found</p>
            <p className="text-xs text-gray-500">
              Create and save an AI-generated note first. Notes generated by the AI automatically compile matching flashcard decks.
            </p>
          </div>
          <Link
            to="/dashboard/generate"
            className="inline-block px-5 py-2.5 text-xs font-bold text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] rounded-xl transition shadow-md"
          >
            Generate AI Note
          </Link>
        </div>
      )}

      {/* Floating notifications */}
      <Toast
        show={toastShow}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastShow(false)}
      />
    </div>
  );
}
