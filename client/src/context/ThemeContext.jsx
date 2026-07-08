import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Dark mode is always on — force it immediately
  const theme = 'dark';

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('notes_theme_color') || 'violet';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('notes_font_size') || 'base';
  });

  // Always apply dark class to <html>
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    localStorage.setItem('notes_theme', 'dark');
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const colors = {
      violet: { rgb: '139, 92, 246', hex: '#8b5cf6' },
      blue: { rgb: '59, 130, 246', hex: '#3b82f6' },
      emerald: { rgb: '16, 185, 129', hex: '#10b981' },
      amber: { rgb: '245, 158, 11', hex: '#f59e0b' },
    };
    const selectedColor = colors[themeColor] || colors.violet;
    root.style.setProperty('--accent-color', selectedColor.rgb);
    root.style.setProperty('--color-accent-primary', selectedColor.hex);

    const hoverColors = {
      violet: '#7c3aed',
      blue: '#2563eb',
      emerald: '#059669',
      amber: '#d97706',
    };
    root.style.setProperty('--color-accent-hover', hoverColors[themeColor] || hoverColors.violet);
    localStorage.setItem('notes_theme_color', themeColor);
  }, [themeColor]);

  useEffect(() => {
    const root = window.document.documentElement;
    const fontSizes = {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    };
    root.style.setProperty('--font-scale', fontSizes[fontSize] || '1rem');
    localStorage.setItem('notes_font_size', fontSize);
  }, [fontSize]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeColor,
        fontSize,
        // toggleTheme is a no-op — dark mode is permanent
        toggleTheme: () => {},
        setThemeColor,
        setFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
