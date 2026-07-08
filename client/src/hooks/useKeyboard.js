import { useEffect } from 'react';

export const useKeyboard = (handlers) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Ctrl/Cmd key
      const isCmdOrCtrl = event.ctrlKey || event.metaKey;

      if (isCmdOrCtrl && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        if (handlers.onGenerateNotes) handlers.onGenerateNotes();
      }

      if (isCmdOrCtrl && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        if (handlers.onMyNotes) handlers.onMyNotes();
      }

      if (isCmdOrCtrl && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (handlers.onSearch) handlers.onSearch();
      }

      if (event.key === 'Escape') {
        if (handlers.onEscape) handlers.onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
};
