import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/user/profile')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { access_token, user } = response.data;
      
      localStorage.setItem('access_token', access_token);
      setUser(user);
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const status = error.response?.data?.status;
      toast.error(message);
      return { success: false, status, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/register', userData);
      toast.success(response.data.message);
      return { success: true, status: response.data.status };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};