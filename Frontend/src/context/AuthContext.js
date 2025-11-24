import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { getToken, removeToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          await authAPI.verify();
          setIsAuthenticated(true);
        } catch (error) {
          removeToken();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password);
      setIsAuthenticated(true);
      return { success: true, data };
    } catch (error) {
      setIsAuthenticated(false);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    removeToken();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

