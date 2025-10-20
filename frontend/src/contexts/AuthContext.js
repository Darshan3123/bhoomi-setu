import { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3 } from './Web3Context';
import { toast } from 'react-toastify';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { account, signMessage, isConnected } = useWeb3();

  // Axios instance with auth token
  const api = axios.create({
    baseURL: API_BASE_URL,
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Check if it's a "User not found" error
        if (error.response?.data?.error === 'User not found') {
          console.log('🔧 User not found error detected - clearing stale authentication');
          logout();
          toast.error('Authentication expired. Please connect your wallet and login again.');
        } else {
          logout();
          toast.error('Session expired. Please login again.');
        }
      }
      return Promise.reject(error);
    }
  );

  // Login with wallet signature
  const login = async () => {
    if (!account || !isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      setLoading(true);

      // Generate message for signing
      const messageResponse = await axios.post(`${API_BASE_URL}/auth/generate-message`, {
        walletAddress: account,
      });

      const { message } = messageResponse.data;

      // Sign the message
      const signature = await signMessage(message);
      if (!signature) {
        return false;
      }

      // Test signature first in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const testResponse = await axios.post(`${API_BASE_URL}/auth/test-signature`, {
            walletAddress: account,
            signature,
            message,
          });
          console.log('🔍 Signature test result:', testResponse.data);
        } catch (testError) {
          console.warn('🔍 Signature test failed:', testError);
        }
      }

      // Verify signature and get token
      const authResponse = await axios.post(`${API_BASE_URL}/auth/verify-wallet`, {
        walletAddress: account,
        signature,
        message,
      });

      const { token: authToken, user: userData, isNewUser } = authResponse.data;

      // Store auth data
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);

      // Store in localStorage
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_data', JSON.stringify(userData));

      toast.success('Successfully authenticated!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more specific error messages
      if (error.code === 'NETWORK_ERROR' || error.message.includes('fetch')) {
        toast.error('Cannot connect to server. Please make sure the backend is running on http://localhost:3002');
      } else if (error.response?.status === 401) {
        // Clear any stale authentication data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        
        if (error.response?.data?.error === 'User not found') {
          toast.error('User not found. Please register first or clear your browser data and try again.');
        } else {
          toast.error('Authentication failed. Please try again.');
        }
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Authentication failed. Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    toast.info('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await api.post('/auth/update-profile', profileData);
      
      if (response.data.success) {
        setUser(prev => ({
          ...prev,
          profile: response.data.profile
        }));
        
        // Update localStorage
        const updatedUser = {
          ...user,
          profile: response.data.profile
        };
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        toast.success('Profile updated successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  // Upload KYC documents
  const uploadKYC = async (formData) => {
    try {
      console.log('Sending KYC upload request...');
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }
      
      const response = await api.post('/auth/upload-kyc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('KYC upload response:', response.data);

      if (response.data.success) {
        toast.success('KYC documents uploaded successfully to IPFS!');
        return true;
      } else {
        console.log('Upload failed - success flag is false');
        toast.error('Upload failed: ' + (response.data.message || response.data.error || 'Unknown error'));
        return false;
      }
    } catch (error) {
      console.error('KYC upload error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      let errorMessage = 'Unknown error';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Failed to upload KYC documents: ' + errorMessage);
      return false;
    }
  };

  // Get KYC status
  const getKYCStatus = async () => {
    try {
      const response = await api.get('/auth/kyc-status');
      return response.data;
    } catch (error) {
      console.error('Get KYC status error:', error);
      return null;
    }
  };

  // Initialize authentication from stored data
  const initializeAuth = async (authToken, userData) => {
    try {
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('Initialize auth error:', error);
      return false;
    }
  };

  // Check stored auth on page load
  useEffect(() => {
    const checkStoredAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');

        if (storedToken && storedUser && account) {
          const userData = JSON.parse(storedUser);
          
          // Verify token is still valid
          try {
            const response = await axios.get(`${API_BASE_URL}/auth/user-role`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            });

            if (response.data && response.data.walletAddress.toLowerCase() === account.toLowerCase()) {
              setToken(storedToken);
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // Token invalid or account mismatch
              console.log('🔧 Account mismatch or invalid response - clearing stored auth');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_data');
            }
          } catch (tokenError) {
            // Token validation failed - clear stored auth
            console.log('🔧 Token validation failed - clearing stored auth:', tokenError.response?.status);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            
            // Don't show error toast here as user might not be trying to authenticate
            if (tokenError.response?.status === 401) {
              console.log('🔧 Stale token detected and cleared');
            }
          }
        }
      } catch (error) {
        console.error('Check stored auth error:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } finally {
        setLoading(false);
      }
    };

    if (account) {
      checkStoredAuth();
    } else {
      setLoading(false);
    }
  }, [account]);

  // Clear auth when wallet disconnects
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      logout();
    }
  }, [isConnected, isAuthenticated]);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    api,
    login,
    logout,
    updateProfile,
    uploadKYC,
    getKYCStatus,
    initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};