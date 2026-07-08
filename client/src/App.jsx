import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotesProvider } from './context/NotesContext';
import { AuthProvider } from './context/AuthContext';

// Layouts
import DefaultLayout from './layouts/DefaultLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Guard
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import GenerateNotes from './pages/GenerateNotes';
import MyNotes from './pages/MyNotes';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import GoogleSignInMock from './pages/GoogleSignInMock';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotesProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* ── Public Pages ──────────────────────────── */}
              <Route path="/" element={<DefaultLayout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* ── Auth Page (standalone, no layout wrapper) */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/google-signin-mock" element={<GoogleSignInMock />} />

              {/* ── Protected Dashboard Pages ─────────────── */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="generate" element={<GenerateNotes />} />
                <Route path="notes" element={<MyNotes />} />
                <Route path="flashcards" element={<FlashcardsPage />} />
                <Route path="quiz" element={<QuizPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
