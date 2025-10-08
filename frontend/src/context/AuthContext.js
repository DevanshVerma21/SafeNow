import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('token');
      console.log('Token validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async (phone, purpose = 'login') => {
    try {
      const response = await axios.post(`${API_BASE}/auth/request_otp`, {
        phone,
        purpose
      });
      
      toast.success(`OTP sent to ${phone}`);
      // For demo purposes, show the OTP
      if (response.data.otp_sample) {
        toast.success(`Demo OTP: ${response.data.otp_sample}`, {
          duration: 8000,
        });
      }
      
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
      throw error;
    }
  };

  const verifyOTP = async (phone, code, role = 'citizen') => {
    try {
      const response = await axios.post(`${API_BASE}/auth/verify_otp`, {
        phone,
        code
      });

      const { access_token, user_id, role: userRole, name } = response.data;
      
      localStorage.setItem('token', access_token);
      
      const userData = {
        id: user_id,
        phone,
        role: userRole || role,
        name: name || 'User',
        authenticated_at: new Date().toISOString()
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Role-based success message
      const roleDisplay = userRole || role;
      toast.success(`Welcome ${name || 'User'}! Logged in as ${roleDisplay}`);
      
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    requestOTP,
    verifyOTP,
    logout,
    checkAuthStatus,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};