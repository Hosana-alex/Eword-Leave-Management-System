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
      // Use the correct profile endpoint
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
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user, password_reset_required } = response.data;
      
      // FIXED: Store token with consistent key name
      localStorage.setItem('access_token', access_token);
      setUser(user);
      
      // Check if password reset is required
      if (password_reset_required) {
        return {
          success: true,
          password_reset_required: true,
          user: user,
          message: 'Password reset required'
        };
      }
      
      // Normal successful login - only show toast if no password reset needed
      toast.success(`Welcome back, ${user.name}!`);
      return {
        success: true,
        password_reset_required: false,
        user: user
      };
      
    } catch (error) {
      const errorData = error.response?.data;
      
      if (error.response?.status === 403 && errorData?.status === 'pending') {
        return {
          success: false,
          status: 'pending',
          message: errorData.message
        };
      }
      
      const errorMessage = errorData?.message || 'Login failed';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const register = async (userData) => {
    try {
      // Use /auth/register endpoint (since blueprint is registered with /api prefix)
      const response = await api.post('/auth/register', userData);
      
      const message = response.data.message;
      const autoApproved = response.data.auto_approved;
      const status = response.data.status;
      
      // Show appropriate success message
      if (autoApproved) {
        toast.success('Registration successful! You can now log in.');
      } else {
        toast.success('Registration submitted for approval.');
      }
      
      return { 
        success: true, 
        status: status,
        auto_approved: autoApproved,
        message: message
      };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/user/profile');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      login, 
      logout, 
      register, 
      loading,
      refreshUser
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