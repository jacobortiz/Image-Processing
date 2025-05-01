import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
      await fetchApiKeys(token);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApiKeys(response.data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post(`${API_URL}/auth/auth/jwt/login`, formData);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      await fetchUserProfile(access_token);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/auth/auth/register`, {
        email,
        password,
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed. Please try again.');
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setApiKeys([]);
  };

  const createApiKey = async (name = 'Default API Key') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/auth/api-keys`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update API keys list
      await fetchApiKeys(token);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating API key:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to create API key' };
    }
  };

  const deleteApiKey = async (keyId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/auth/api-keys/${keyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update API keys list
      await fetchApiKeys(token);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting API key:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to delete API key' };
    }
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    apiKeys,
    loading,
    error,
    login,
    register,
    logout,
    createApiKey,
    deleteApiKey,
    getAuthHeader,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 