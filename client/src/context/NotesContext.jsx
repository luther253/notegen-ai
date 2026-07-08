import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

const DEFAULT_SUBJECTS = ['Computer Science', 'Mathematics', 'Physics', 'History', 'Literature'];

const WELCOME_NOTE = {
  id: 'welcome-tutorial',
  title: 'Welcome to AI Student Notes Generator!',
  subject: 'Computer Science',
  topic: 'Productivity & App Guide',
  difficulty: 'Beginner',
  length: 'Medium',
  style: 'Bullet Points',
  language: 'English',
  content: `# Welcome to AI Student Notes Generator 🚀

This is a comprehensive study assistant that uses AI to generate structured student notes, quizzes, and flashcards instantly. Here's a quick guide to help you get started:

## Key Features 🌟

* **AI Notes Generator**: Specify a subject, topic, difficulty, style, and language. The AI will output perfectly formatted student notes including introduction, explanations, real-world applications, and exam tips.
* **My Notes Management**: View, search, filter, edit, favorite, and duplicate your notes. You can also export them as Markdown, download them as plain text, or print them as a clean PDF layout.
* **Flashcards Tool**: Instantly convert any generated note into interactive 3D flipping flashcards to test your recall.
* **Quiz Generator**: Test your comprehension! Generate customized multiple-choice, true/false, or short-answer quizzes based on your notes.
* **Study Customizations**: Visit Settings to toggle light/dark modes, change the primary theme color (violet, blue, emerald, amber), scale font sizes, or input your Gemini or OpenAI API keys!

## Study Tips for Students 💡

> **Active Recall & Spaced Repetition**: Don't just read the notes. Generate flashcards and take the quizzes multiple times over several days to commit the knowledge to long-term memory.

### How to use Keyboard Shortcuts ⌨️
* **\`Ctrl + G\`**: Navigate to Notes Generator page
* **\`Ctrl + N\`**: Navigate to My Notes page
* **\`Ctrl + F\`**: Open search bar
* **\`Esc\`**: Close overlays, modals, and menus

Enjoy studying! Double-click on any note in **My Notes** to edit, duplicate, or delete it.`,
  isFavorite: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  wordCount: 260,
  readingTime: 2
};

export const NotesProvider = ({ children }) => {
  const { user, updateProfile } = useAuth();
  const [notes, setNotes] = useState([WELCOME_NOTE]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [quizzes, setQuizzes] = useState([]);

  // Fetch initial notes, custom subjects, and quizzes from MongoDB on auth change
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const notesRes = await axios.get('/api/notes');
          const mappedNotes = notesRes.data.map(n => ({ ...n, id: n._id }));
          setNotes(mappedNotes.length > 0 ? mappedNotes : [WELCOME_NOTE]);

          const quizzesRes = await axios.get('/api/quizzes');
          const mappedQuizzes = quizzesRes.data.map(q => ({ ...q, id: q._id }));
          setQuizzes(mappedQuizzes);

          if (user.customSubjects && user.customSubjects.length > 0) {
            setSubjects(user.customSubjects);
          }
        } catch (err) {
          console.warn('Failed to load user notes/quizzes from database:', err.message);
          // Fallback to local storage
          loadLocalFallback();
        }
      } else {
        loadLocalFallback();
      }
    };

    const loadLocalFallback = () => {
      const savedNotes = localStorage.getItem('notes_list');
      const savedSubjects = localStorage.getItem('subjects_list');
      const savedQuizzes = localStorage.getItem('quizzes_list');

      setNotes(savedNotes ? JSON.parse(savedNotes) : [WELCOME_NOTE]);
      setSubjects(savedSubjects ? JSON.parse(savedSubjects) : DEFAULT_SUBJECTS);
      setQuizzes(savedQuizzes ? JSON.parse(savedQuizzes) : []);
    };

    fetchUserData();
  }, [user]);

  // Sync to LocalStorage for offline backup
  useEffect(() => {
    localStorage.setItem('notes_list', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('subjects_list', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('quizzes_list', JSON.stringify(quizzes));
  }, [quizzes]);

  // Note actions
  const addNote = async (noteData) => {
    const wordCount = noteData.content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    const payload = {
      title: noteData.title || 'Untitled Note',
      subject: noteData.subject || 'General',
      topic: noteData.topic || 'General Topic',
      difficulty: noteData.difficulty || 'Intermediate',
      length: noteData.length || 'Medium',
      style: noteData.style || 'Bullet Points',
      language: noteData.language || 'English',
      content: noteData.content,
      isFavorite: false,
      wordCount,
      readingTime,
      flashcards: noteData.flashcards || [],
      quiz: noteData.quiz || []
    };

    if (user) {
      try {
        const response = await axios.post('/api/notes', payload);
        const newNote = { ...response.data, id: response.data._id };
        setNotes((prev) => [newNote, ...prev]);
        return newNote;
      } catch (err) {
        console.error('Failed to save note to DB:', err);
      }
    }

    // Local Fallback
    const localNote = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes((prev) => [localNote, ...prev]);
    return localNote;
  };

  const updateNote = async (id, updatedFields) => {
    if (id === 'welcome-tutorial') {
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, ...updatedFields } : note))
      );
      return;
    }

    const payload = { ...updatedFields };
    if (updatedFields.content !== undefined) {
      const wordCount = updatedFields.content.split(/\s+/).filter(Boolean).length;
      payload.wordCount = wordCount;
      payload.readingTime = Math.max(1, Math.round(wordCount / 200));
    }

    if (user) {
      try {
        const response = await axios.put(`/api/notes/${id}`, payload);
        const updated = { ...response.data, id: response.data._id };
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? updated : note))
        );
        return;
      } catch (err) {
        console.error('Failed to update note in DB:', err);
      }
    }

    // Local update fallback
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === id) {
          return { ...note, ...payload, updatedAt: new Date().toISOString() };
        }
        return note;
      })
    );
  };

  const deleteNote = async (id) => {
    if (user && id !== 'welcome-tutorial') {
      try {
        await axios.delete(`/api/notes/${id}`);
      } catch (err) {
        console.error('Failed to delete note from DB:', err);
      }
    }
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const duplicateNote = async (id) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const payload = {
      title: `${target.title} (Copy)`,
      subject: target.subject,
      topic: target.topic,
      difficulty: target.difficulty,
      length: target.length,
      style: target.style,
      language: target.language,
      content: target.content,
      isFavorite: target.isFavorite,
      wordCount: target.wordCount,
      readingTime: target.readingTime,
      flashcards: target.flashcards,
      quiz: target.quiz
    };

    if (user && id !== 'welcome-tutorial') {
      try {
        const response = await axios.post('/api/notes', payload);
        const duplicated = { ...response.data, id: response.data._id };
        setNotes((prev) => [duplicated, ...prev]);
        return duplicated;
      } catch (err) {
        console.error('Failed to duplicate note to DB:', err);
      }
    }

    // Local fallback
    const localDuplicated = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes((prev) => [localDuplicated, ...prev]);
    return localDuplicated;
  };

  const toggleFavoriteNote = async (id) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const newFavStatus = !target.isFavorite;

    if (user && id !== 'welcome-tutorial') {
      try {
        await axios.put(`/api/notes/${id}`, { isFavorite: newFavStatus });
      } catch (err) {
        console.error('Failed to toggle favorite status in DB:', err);
      }
    }

    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, isFavorite: newFavStatus } : note))
    );
  };

  // Subject actions
  const addSubject = async (name) => {
    const cleaned = name.trim();
    if (!cleaned) return false;
    if (subjects.some((s) => s.toLowerCase() === cleaned.toLowerCase())) return false;

    const newSubjects = [...subjects, cleaned];
    setSubjects(newSubjects);

    if (user) {
      await updateProfile(user.username, user.university, user.course, newSubjects);
    }
    return true;
  };

  const deleteSubject = async (name) => {
    const newSubjects = subjects.filter((s) => s !== name);
    setSubjects(newSubjects);

    if (user) {
      await updateProfile(user.username, user.university, user.course, newSubjects);
    }
  };

  // Quiz actions
  const addQuizAttempt = async (noteId, title, questions, score, maxScore) => {
    const payload = {
      noteId,
      title,
      score,
      maxScore
    };

    if (user) {
      try {
        const response = await axios.post('/api/quizzes', payload);
        const newAttempt = { ...response.data, id: response.data._id };
        setQuizzes((prev) => [newAttempt, ...prev]);
        return newAttempt;
      } catch (err) {
        console.error('Failed to log quiz attempt in DB:', err);
      }
    }

    // Local fallback
    const localAttempt = {
      ...payload,
      id: crypto.randomUUID(),
      takenAt: new Date().toISOString()
    };
    setQuizzes((prev) => [localAttempt, ...prev]);
    return localAttempt;
  };

  const clearAllData = () => {
    setNotes([]);
    setSubjects(DEFAULT_SUBJECTS);
    setQuizzes([]);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        subjects,
        quizzes,
        addNote,
        updateNote,
        deleteNote,
        duplicateNote,
        toggleFavoriteNote,
        addSubject,
        deleteSubject,
        addQuizAttempt,
        clearAllData,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};
