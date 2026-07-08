import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiHeart, 
  FiTrash2, 
  FiCopy, 
  FiEdit, 
  FiCheck, 
  FiPlus, 
  FiClock, 
  FiBookOpen, 
  FiLayers, 
  FiCheckSquare,
  FiPrinter,
  FiDownload,
  FiX,
  FiFolder,
  FiMessageSquare
} from 'react-icons/fi';
import { useNotes } from '../context/NotesContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { downloadAsTXT, downloadAsPDF, printNoteToPDF } from '../utils/pdfGenerator';
import Toast from '../components/Toast';
import NoteChat from '../components/NoteChat';

export default function MyNotes() {
  const { notes, subjects, updateNote, deleteNote, duplicateNote, toggleFavoriteNote } = useNotes();
  const location = useLocation();
  const navigate = useNavigate();

  // Selected note state
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  
  // Editor form states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');

  // Filtering / Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('date-new'); // 'date-new', 'date-old', 'title-az', 'title-za'

  // Confirm delete modal states
  const [noteToDelete, setNoteToDelete] = useState(null);

  // Toast notifications
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // AI Chat panel
  const [chatOpen, setChatOpen] = useState(false);

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  // Handle URL redirect query parameters (?id=xxx)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      const noteExists = notes.some(n => n.id === id);
      if (noteExists) {
        setSelectedNoteId(id);
        setIsEditing(false);
      }
    } else if (notes.length > 0 && !selectedNoteId) {
      // Default to first note
      setSelectedNoteId(notes[0].id);
    }
  }, [location.search, notes, selectedNoteId]);

  // Find active selected note
  const activeNote = notes.find((note) => note.id === selectedNoteId);

  // Load editor content when note changes
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditSubject(activeNote.subject);
      setEditTopic(activeNote.topic);
      setEditContent(activeNote.content);
    }
  }, [selectedNoteId, activeNote]);

  // Filter & Sort notes list
  const getFilteredNotes = () => {
    let list = [...notes];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q) ||
          n.topic.toLowerCase().includes(q)
      );
    }

    // Subject Filter
    if (selectedSubject !== 'All') {
      list = list.filter((n) => n.subject === selectedSubject);
    }

    // Favorites Filter
    if (showOnlyFavorites) {
      list = list.filter((n) => n.isFavorite);
    }

    // Sort operations
    list.sort((a, b) => {
      if (sortBy === 'date-new') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'date-old') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'title-az') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title-za') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return list;
  };

  const filteredNotesList = getFilteredNotes();

  // Save edit notes handler
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      triggerToast('Title and content cannot be empty.', 'error');
      return;
    }
    updateNote(selectedNoteId, {
      title: editTitle.trim(),
      subject: editSubject,
      topic: editTopic.trim(),
      content: editContent,
    });
    setIsEditing(false);
    triggerToast('Notes saved successfully.');
  };

  const handleDuplicate = async (id) => {
    const newNote = await duplicateNote(id);
    if (newNote) {
      setSelectedNoteId(newNote.id);
      triggerToast('Notes duplicated successfully.');
    }
  };

  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
  };

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      triggerToast(`"${noteToDelete.title}" deleted.`);
      setNoteToDelete(null);
      // Select another note
      const remaining = notes.filter((n) => n.id !== noteToDelete.id);
      if (remaining.length > 0) {
        setSelectedNoteId(remaining[0].id);
      } else {
        setSelectedNoteId(null);
      }
    }
  };

  const handleNewBlankNote = async () => {
    const blank = await addNote({
      title: 'Blank Note',
      subject: subjects[0] || 'General',
      topic: 'Custom Topic',
      content: '# Blank Note\n\nDouble-click here or hit edit to start writing custom notes.',
    });
    setSelectedNoteId(blank.id);
    setIsEditing(true);
    triggerToast('Blank notes template created.');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 overflow-hidden relative z-10">
      
      {/* LEFT COLUMN: List pane */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col flex-shrink-0 glass-panel border border-gray-200/10 rounded-3xl overflow-hidden h-full">
        
        {/* Header Search & Filtering */}
        <div className="p-4 border-b border-gray-200/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm">My Study Notes</h3>
            <button
              onClick={handleNewBlankNote}
              className="p-2 rounded-xl text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer text-xs flex items-center gap-1 font-bold shadow-xs"
            >
              <FiPlus /> New
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search title, topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8.5 pr-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] outline-hidden font-medium"
            />
          </div>

          {/* Filter selects */}
          <div className="flex gap-2.5 text-xxs font-bold">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 outline-hidden font-medium cursor-pointer"
            >
              <option value="All">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 outline-hidden font-medium cursor-pointer"
            >
              <option value="date-new">Newest First</option>
              <option value="date-old">Oldest First</option>
              <option value="title-az">A-Z Alphabet</option>
              <option value="title-za">Z-A Alphabet</option>
            </select>
          </div>

          {/* Favorites filter toggle */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center gap-1.5 text-xxs font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
              showOnlyFavorites
                ? 'border-rose-500/30 text-rose-500 bg-rose-500/5'
                : 'border-gray-200/20 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiHeart className={showOnlyFavorites ? 'fill-rose-500' : ''} /> Favorite Notes Only
          </button>
        </div>

        {/* Scrollable list items */}
        <div className="flex-grow overflow-y-auto divide-y divide-gray-200/10">
          {filteredNotesList.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FiBookOpen className="mx-auto text-3xl opacity-30 mb-2" />
              <p className="text-xs">No notes matching filter</p>
            </div>
          ) : (
            filteredNotesList.map((note) => {
              const isNoteSelected = note.id === selectedNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setIsEditing(false);
                  }}
                  className={`p-4 text-left cursor-pointer transition-all duration-150 flex items-start justify-between gap-3 ${
                    isNoteSelected 
                      ? 'bg-violet-500/10 dark:bg-violet-500/5 border-l-3 border-[rgb(var(--accent-color))]' 
                      : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[rgb(var(--accent-color))] tracking-wider">
                      {note.subject}
                    </span>
                    <h4 className="font-display font-bold text-xs text-gray-800 dark:text-white truncate mt-1">
                      {note.title}
                    </h4>
                    <p className="text-xxs text-gray-500 dark:text-gray-400 truncate mt-0.5">{note.topic}</p>
                    <div className="flex items-center gap-2 text-xxs text-gray-400 mt-2 font-medium">
                      <span className="flex items-center gap-0.5"><FiClock /> {note.readingTime}m</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    {/* Favorite toggle bookmark click */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteNote(note.id);
                      }}
                      className="p-1 rounded-md text-gray-400 hover:text-rose-500 transition-colors"
                      title="Bookmark note"
                    >
                      <FiHeart className={note.isFavorite ? 'text-rose-500 fill-rose-500' : ''} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Viewer / Editor pane */}
      <div className="hidden md:flex flex-grow flex-col glass-panel border border-gray-200/10 rounded-3xl overflow-hidden h-full min-w-0">
        {activeNote ? (
          <>
            {/* Header toolbar */}
            <div className="px-6 py-4 border-b border-gray-200/10 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="min-w-0">
                <span className="text-xxs font-bold text-[rgb(var(--accent-color))] bg-violet-500/10 px-2 py-0.5 rounded-md">
                  {activeNote.subject}
                </span>
                <h2 className="font-display font-bold text-sm text-gray-800 dark:text-white mt-1.5 truncate">
                  {activeNote.title}
                </h2>
              </div>

              {/* Action utilities */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                
                {/* AI Chat toggle */}
                <button
                  onClick={() => setChatOpen(o => !o)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    chatOpen
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-400'
                      : 'border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                  title="Chat with AI about this note"
                >
                  <FiMessageSquare className="text-sm" />
                </button>

                {/* Toggle edit */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
                    title="Edit Note"
                  >
                    <FiEdit className="text-sm" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
                    title="Cancel Edit"
                  >
                    <FiX className="text-sm" />
                  </button>
                )}

                {/* Duplicate */}
                <button
                  onClick={() => handleDuplicate(activeNote.id)}
                  className="p-2 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
                  title="Duplicate Note"
                >
                  <FiCopy className="text-sm" />
                </button>

                {/* Print PDF */}
                <button
                  onClick={() => printNoteToPDF(activeNote)}
                  className="p-2 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
                  title="Print Note / Save PDF"
                >
                  <FiPrinter className="text-sm" />
                </button>

                {/* Download PDF */}
                <button
                  onClick={() => downloadAsPDF(activeNote)}
                  className="p-2 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 cursor-pointer shadow-xs"
                  title="Download note as PDF (.pdf)"
                >
                  <FiDownload className="text-sm" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteClick(activeNote)}
                  className="p-2 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                  title="Delete Note"
                >
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            </div>

            {/* Split view: note content + optional chat panel */}
            <div className="flex flex-grow overflow-hidden">
              {/* Note content body */}
              <div className={`flex-grow overflow-y-auto p-6 text-left transition-all duration-300 ${chatOpen ? 'w-1/2' : 'w-full'}`}>
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.form
                      key="editor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSaveEdit}
                      className="flex flex-col h-full gap-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Note Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] outline-hidden font-bold"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Subject</label>
                          <select
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 outline-hidden font-bold cursor-pointer"
                          >
                            {subjects.map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex-grow flex flex-col space-y-1.5">
                        <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                          <span>Markdown Editor</span>
                          <span className="text-xxs text-gray-500">Supports standard headers &amp; tags</span>
                        </label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-grow w-full text-xs px-4 py-3 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] outline-hidden font-mono resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200/10">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-5 py-2.5 text-xs font-semibold border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          <FiCheck /> Save Changes
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="viewer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Study redirection link boxes */}
                      <div className="flex gap-3 bg-violet-500/5 p-3.5 rounded-2xl border border-violet-500/10 text-xs">
                        <div className="p-2 rounded-lg bg-violet-500/15 text-[rgb(var(--accent-color))] text-base flex-shrink-0">
                          <FiBookOpen />
                        </div>
                        <div className="text-left leading-normal flex-grow">
                          <p className="font-bold text-gray-800 dark:text-gray-200">Study Mode Available</p>
                          <p className="text-xxs text-gray-500 dark:text-gray-400 mt-0.5">Revise key details by studying flashcards or testing comprehension with quizzes.</p>
                        </div>
                        <div className="flex gap-2.5 items-center">
                          <Link
                            to={`/dashboard/flashcards?id=${activeNote.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 font-bold rounded-lg bg-violet-500 text-white hover:bg-violet-600 text-xxs transition shadow-sm cursor-pointer"
                          >
                            <FiLayers /> Cards
                          </Link>
                          <Link
                            to={`/dashboard/quiz?id=${activeNote.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-xxs transition shadow-sm cursor-pointer"
                          >
                            <FiCheckSquare /> Quiz
                          </Link>
                        </div>
                      </div>

                      <MarkdownRenderer content={activeNote.content} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AI Chat panel */}
              <AnimatePresence>
                {chatOpen && (
                  <motion.div
                    key="chat"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '360px', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    className="flex-shrink-0 overflow-hidden h-full"
                    style={{ minWidth: chatOpen ? '300px' : '0' }}
                  >
                    <NoteChat note={activeNote} onClose={() => setChatOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-gray-400">
            <FiBookOpen className="text-5xl opacity-35 mb-2 animate-bounce-slow" />
            <p className="text-sm font-semibold">Select a study note from the left to view</p>
          </div>
        )}
      </div>

      {/* Mobile Responsive overlay view if selected on phone */}
      <AnimatePresence>
        {activeNote && (
          <div className="md:hidden fixed inset-0 z-30 bg-slate-50 dark:bg-[#070a13] flex flex-col">
            
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-gray-200/10 flex items-center justify-between gap-4 glass-panel">
              <button
                onClick={() => setSelectedNoteId(null)}
                className="p-2.5 rounded-xl border border-gray-200/20 text-gray-600 dark:text-gray-300 cursor-pointer"
              >
                <FiX />
              </button>
              <div className="min-w-0 text-left flex-grow">
                <span className="text-[10px] font-bold text-[rgb(var(--accent-color))]">{activeNote.subject}</span>
                <h4 className="font-display font-bold text-xs text-gray-800 dark:text-white truncate leading-tight mt-0.5">{activeNote.title}</h4>
              </div>
              <button
                onClick={() => printNoteToPDF(activeNote)}
                className="p-2.5 rounded-xl border border-gray-200/20 text-gray-600 dark:text-gray-300 cursor-pointer"
              >
                <FiPrinter />
              </button>
            </div>

            {/* Scroll body */}
            <div className="flex-grow overflow-y-auto p-5 text-left">
              <div className="flex gap-2.5 justify-center mb-6">
                <Link
                  to={`/dashboard/flashcards?id=${activeNote.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold rounded-xl bg-violet-500 text-white text-xs text-center cursor-pointer shadow-md"
                >
                  <FiLayers /> Flashcards
                </Link>
                <Link
                  to={`/dashboard/quiz?id=${activeNote.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold rounded-xl bg-emerald-500 text-white text-xs text-center cursor-pointer shadow-md"
                >
                  <FiCheckSquare /> Take Quiz
                </Link>
              </div>
              <MarkdownRenderer content={activeNote.content} />
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {noteToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setNoteToDelete(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0f1423] border border-gray-200/10 rounded-2xl p-6 shadow-2xl z-10 text-left space-y-4"
            >
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl w-fit text-lg">
                <FiTrash2 />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-gray-800 dark:text-white">Delete Note?</h4>
                <p className="text-xxs text-gray-500 mt-1">
                  Are you sure you want to delete **"{noteToDelete.title}"**? This study note will be permanently erased.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setNoteToDelete(null)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating alerts notifications */}
      <Toast
        show={toastShow}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastShow(false)}
      />
    </div>
  );
}
