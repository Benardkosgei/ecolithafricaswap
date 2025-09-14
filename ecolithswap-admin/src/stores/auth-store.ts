import { create } from 'zustand';
import { authAPI } from '../lib/api';
import { Customer } from '../lib/api'; // Import the Customer type

interface AuthState {
  user: Customer | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void; // No longer async as we don't call an API endpoint
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true, // Start with loading true for the initial check
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const response = await authAPI.login({ email, password }); // Pass credentials as an object
      
      if (response.data?.user && response.data?.token) {
        // Check for admin role before setting as authenticated
        if (!['admin', 'station_manager'].includes(response.data.user.role)) {
          throw new Error('Access denied. You do not have sufficient privileges.');
        }

        // Store token in local storage
        localStorage.setItem('token', response.data.token);
        
        set({
          user: response.data.user,
          isAuthenticated: true,
        });
      } else {
        throw new Error('Invalid response from server during login.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial auth state on error
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
      throw error; // Re-throw to be caught in the component
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    // No API call, just clear local state and storage
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, loading: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // The interceptor in api.ts adds the token to the header
        const response = await authAPI.getProfile();

        if (response.data) {
           // Verify user role
          if (!['admin', 'station_manager'].includes(response.data.role)) {
            get().logout(); // Use logout function to clear state
          } else {
             set({ user: response.data, isAuthenticated: true, loading: false });
          }
        } else {
            get().logout(); // Use logout function to clear state
        }
      } else {
         set({ user: null, isAuthenticated: false, loading: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      get().logout(); // Use logout function to clear state
    }
  },
}));
