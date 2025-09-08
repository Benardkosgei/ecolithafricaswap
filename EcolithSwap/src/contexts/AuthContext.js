import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  INITIALIZE_SUCCESS: 'INITIALIZE_SUCCESS',
  INITIALIZE_FAILURE: 'INITIALIZE_FAILURE',
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload.updates },
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.INITIALIZE_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.INITIALIZE_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Auth Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const isInitialized = await authService.initialize();
      
      if (isInitialized) {
        const user = authService.getCurrentUserData();
        dispatch({
          type: AUTH_ACTIONS.INITIALIZE_SUCCESS,
          payload: { user },
        });
      } else {
        dispatch({ type: AUTH_ACTIONS.INITIALIZE_FAILURE });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: AUTH_ACTIONS.INITIALIZE_FAILURE });
    }
  };

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await authService.login(email, password);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.user },
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await authService.register(userData);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user: response.user },
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorMessage },
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      await authService.updateProfile(profileData);
      
      // Get updated user data
      const updatedUser = authService.getCurrentUserData();
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: { updates: updatedUser },
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const success = await authService.refreshToken();
      return success;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If token refresh fails, logout user
      await logout();
      return false;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user && state.user.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Check if user is station manager
  const isStationManager = () => {
    return hasRole('station_manager');
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    clearError,
    
    // Utilities
    hasRole,
    isAdmin,
    isStationManager,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;