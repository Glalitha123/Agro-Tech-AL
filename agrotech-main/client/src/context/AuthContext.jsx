import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync state with storage on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Optionally verify token in background
        try {
          const { data } = await api.get('/api/auth/profile');
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch (err) {
          console.warn('Session verification failed, user logged out.');
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Action: Register User
  const register = async (name, email, password, role, state, landSize, category, primaryCrops) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/auth/register', {
        name,
        email,
        password,
        role,
        state,
        landSize,
        category,
        primaryCrops,
      });

      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        profile: data.profile,
      });
      setToken(data.token);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        profile: data.profile,
      }));

      setLoading(false);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  // Action: Login User
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });

      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        profile: data.profile,
      });
      setToken(data.token);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        profile: data.profile,
      }));

      setLoading(false);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  // Action: Update User Profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.put('/api/auth/profile', profileData);

      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        profile: data.profile,
      });
      setToken(data.token);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        profile: data.profile,
      }));

      setLoading(false);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Profile update failed';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  // Action: Set OAuth Session
  const loginWithOAuthSession = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setLoading(false);
  };

  // Action: Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        loginWithOAuthSession,
        updateProfile,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

