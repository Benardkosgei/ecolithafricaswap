import apiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Initialize auth service (check for stored token)
  async initialize() {
    try {
      const token = await apiService.getStoredToken();
      if (token) {
        // Verify token by getting user profile
        const userData = await this.getCurrentUser();
        if (userData) {
          this.currentUser = userData;
          this.isAuthenticated = true;
          return true;
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await this.logout();
    }
    return false;
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      if (response.token) {
        await apiService.storeToken(response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        this.currentUser = response.user;
        this.isAuthenticated = true;
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await apiService.post('/auth/login', {
        email,
        password
      });
      
      if (response.token) {
        await apiService.storeToken(response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        this.currentUser = response.user;
        this.isAuthenticated = true;
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.isAuthenticated) {
        await apiService.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data regardless of API call success
      await apiService.removeToken();
      await AsyncStorage.removeItem('refreshToken');
      this.currentUser = null;
      this.isAuthenticated = false;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await apiService.get('/auth/profile');
      this.currentUser = response.data ? response.data.user : response.user;
      return this.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/auth/profile', profileData);
      
      // Refresh user data
      await this.getCurrentUser();
      
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiService.post('/auth/refresh', {
        refreshToken
      });
      
      if (response.token) {
        await apiService.storeToken(response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return false;
    }
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  // Get current user data
  getCurrentUserData() {
    return this.currentUser;
  }

  // Check if user has specific role
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Check if user is station manager
  isStationManager() {
    return this.hasRole('station_manager');
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;