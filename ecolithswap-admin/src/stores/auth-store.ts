import { create } from 'zustand'
import { authAPI } from '../lib/api'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const response = await authAPI.login(email, password)
      
      if (response.data?.user && response.data?.token) {
        // Store JWT token
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Check if user has admin privileges
        if (!['admin', 'station_manager'].includes(response.data.user.role)) {
          throw new Error('Access denied. Admin privileges required.')
        }
        
        set({
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            full_name: response.data.user.full_name,
            role: response.data.user.role,
            avatar_url: response.data.user.avatar_url,
          },
          isAuthenticated: true,
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },

  checkAuth: async () => {
    set({ loading: true })
    try {
      const token = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user')
      
      if (token && storedUser) {
        try {
          // Verify token with backend
          const response = await authAPI.getProfile()
          
          if (response.data?.user) {
            set({
              user: {
                id: response.data.user.id,
                email: response.data.user.email,
                full_name: response.data.user.full_name,
                role: response.data.user.role,
                avatar_url: response.data.user.avatar_url,
              },
              isAuthenticated: true,
            })
          } else {
            // Token invalid, clear auth
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            set({ user: null, isAuthenticated: false })
          }
        } catch (error) {
          // Token expired or invalid
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          set({ user: null, isAuthenticated: false })
        }
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ loading: false })
    }
  },
}))
