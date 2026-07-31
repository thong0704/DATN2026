import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const LIGHT_THEME = {
  isDark: false,
  background: '#f8fafc',
  cardBackground: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  primary: '#1e3a8a',
  primaryDark: '#0f172a',
  accent: '#d97706',
  inputBg: '#f1f5f9',
};

export const DARK_THEME = {
  isDark: true,
  background: '#0f172a',
  cardBackground: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#334155',
  primary: '#3b82f6',
  primaryDark: '#0284c7',
  accent: '#f59e0b',
  inputBg: '#334155',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@app_theme_dark');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'true');
      }
    } catch (e) {
      console.log('Error loading theme:', e);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('@app_theme_dark', newMode ? 'true' : 'false');
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
