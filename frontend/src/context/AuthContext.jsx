import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State from LocalStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to parse user from local storage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Signup Action
  const signup = useCallback(async (username, email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/signup', {
        username,
        email,
        password,
      });

      const { token: jwtToken, user: userData } = response.data;

      // Store in localStorage
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error; // Let component handle error notifications
    } finally {
      setLoading(false);
    }
  }, []);

  // Login Action
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      const { token: jwtToken, user: userData } = response.data;

      // Store in localStorage
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error; // Let component handle error notifications
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout Action
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    signup,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook to consume AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
