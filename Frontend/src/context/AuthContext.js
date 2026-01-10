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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const data = await authAPI.verify();
          if (data.valid && data.user) {
            setIsAuthenticated(true);
            setUser(data.user);
          } else {
            removeToken();
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          removeToken();
          setIsAuthenticated(false);
          setUser(null);
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
      setUser(data.user);
      return { success: true, data };
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    removeToken();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

