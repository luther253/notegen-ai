import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Set Authorization header for all requests if token is available
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('notes_auth_user');
    const savedToken = localStorage.getItem('notes_auth_token');
    if (savedToken) {
      setAuthToken(savedToken);
    }
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('notes_auth_user', JSON.stringify(user));
      localStorage.setItem('notes_user_name', user.username);
      if (user.university) localStorage.setItem('notes_user_uni', user.university);
      if (user.course) localStorage.setItem('notes_user_course', user.course);
    } else {
      localStorage.removeItem('notes_auth_user');
      localStorage.removeItem('notes_auth_token');
      localStorage.removeItem('notes_user_name');
      localStorage.removeItem('notes_user_uni');
      localStorage.removeItem('notes_user_course');
      setAuthToken(null);
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const userData = response.data;
      
      localStorage.setItem('notes_auth_token', userData.token);
      setAuthToken(userData.token);
      
      setUser({
        _id: userData._id,
        username: userData.username,
        email: userData.email,
        university: userData.university || 'Stanford University',
        course: userData.course || 'Computer Science',
        avatar: userData.avatar,
        customSubjects: userData.customSubjects,
        credits: userData.credits !== undefined ? userData.credits : 5,
        isPremium: userData.isPremium || false
      });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username, email, password, university = '', course = '') => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
        university,
        course
      });
      const userData = response.data;

      localStorage.setItem('notes_auth_token', userData.token);
      setAuthToken(userData.token);

      setUser({
        _id: userData._id,
        username: userData.username,
        email: userData.email,
        university: userData.university,
        course: userData.course,
        avatar: userData.avatar,
        customSubjects: userData.customSubjects,
        credits: userData.credits !== undefined ? userData.credits : 5,
        isPremium: userData.isPremium || false
      });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const loginAsGuest = async (email = '', name = '', avatar = '') => {
    const guestEmail = email.trim() || 'guest@notegen.ai';
    const guestUsername = name.trim() || (guestEmail.split('@')[0].charAt(0).toUpperCase() + guestEmail.split('@')[0].slice(1));

    try {
      // Call the dedicated Google login endpoint - no password needed
      const response = await axios.post('/api/auth/google-login', {
        email: guestEmail,
        name: guestUsername,
        avatar: avatar || null,
      });

      const userData = response.data;
      localStorage.setItem('notes_auth_token', userData.token);
      setAuthToken(userData.token);

      setUser({
        _id: userData._id,
        username: userData.username,
        email: userData.email,
        university: userData.university || 'Stanford University',
        course: userData.course || 'General Education',
        avatar: avatar || userData.avatar || null,
        customSubjects: userData.customSubjects,
        credits: userData.credits !== undefined ? userData.credits : 5,
        isPremium: userData.isPremium || false
      });
      return true;
    } catch (error) {
      console.error('Google OAuth login failed, using client session:', error);
      // Last resort local-only session
      setUser({
        username: guestUsername,
        email: guestEmail,
        university: 'Stanford University',
        course: 'General Education',
        avatar: avatar || null,
        credits: 5,
        isPremium: false
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = async (username, university, course, customSubjects) => {
    if (!user) return false;
    try {
      const response = await axios.put('/api/auth/profile', {
        username,
        university,
        course,
        customSubjects
      });
      setUser((prev) => ({
        ...prev,
        ...response.data
      }));
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const upgradeUser = async () => {
    if (!user) return false;
    try {
      const response = await axios.post('/api/auth/upgrade');
      const { credits, isPremium } = response.data;
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, credits, isPremium };
        localStorage.setItem('notes_auth_user', JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (error) {
      console.error('Upgrade request failed:', error);
      return false;
    }
  };

  const updateCreditsRemaining = (creditsRemaining) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, credits: creditsRemaining };
      localStorage.setItem('notes_auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        loginAsGuest,
        logout,
        updateProfile,
        upgradeUser,
        updateCreditsRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
