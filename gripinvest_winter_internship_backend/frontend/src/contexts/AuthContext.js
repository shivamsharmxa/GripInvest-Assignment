import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const response = await authAPI.getProfile();
      if (response.success) {
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user: response.data } 
        });
      } else {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        localStorage.setItem('token', response.data.tokens.accessToken);
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user: response.data.user } 
        });
        toast.success('Login successful!');
        return { success: true };
      } else {
        const errorMessage = response.message || 'Login failed';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authAPI.signup(userData);
      
      if (response.success) {
        toast.success('Registration successful! Please check your email for verification.');
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true };
      } else {
        const errorMessage = response.message || 'Registration failed';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        dispatch({ 
          type: 'UPDATE_PROFILE', 
          payload: response.data 
        });
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        const errorMessage = response.message || 'Profile update failed';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const forgotPassword = async (email) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authAPI.forgotPassword(email);
      
      if (response.success) {
        toast.success('Password reset email sent!');
        return { success: true };
      } else {
        const errorMessage = response.message || 'Password reset failed';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authAPI.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        toast.success('Password changed successfully!');
        return { success: true };
      } else {
        const errorMessage = response.message || 'Password change failed';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value = {
    ...state,
    login,
    signup,
    logout,
    updateProfile,
    forgotPassword,
    changePassword,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};