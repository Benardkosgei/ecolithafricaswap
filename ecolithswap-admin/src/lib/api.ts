import axios from 'axios';
import { z } from 'zod';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
const login = (credentials: object) => api.post('/auth/login', credentials);
const getProfile = () => api.get('/auth/profile');

// Users / Profiles
const getUsers = (params: object) => api.get('/users', { params });
const getUser = (id: string) => api.get(`/users/${id}`);
const createUser = (data: object) => api.post('/users', data);
const updateUser = (id: string, data: object) => api.put(`/users/${id}`, data);
const deleteUser = (id: string) => api.delete(`/users/${id}`);

// Customers
const getCustomers = (page: number, limit: number, filters: object) => 
  api.get('/customers', { params: { page, limit, ...filters } });

// System Settings
const getSystemSettings = () => api.get('/settings');
const updateSystemSettings = (data: object) => api.put('/settings', data);

// Dashboard / Admin
const getDashboardStats = () => api.get('/dashboard/stats');
const getRecentActivities = (limit: number) => api.get('/dashboard/activities', { params: { limit } });
const getSystemHealth = () => api.get('/system/health');
const exportData = (reportType: string, params: object) => 
  api.get(`/reports/${reportType}`, { params, responseType: 'blob' });

// API Exports
export const authAPI = { login, getProfile };

export const userProfilesAPI = { 
  getUsers, 
  getUser, 
  createUser, 
  updateProfile: updateUser, // Aliasing for consistency with component
  deleteUser 
};

export const customersAPI = { getCustomers };

export const systemSettingsAPI = { getSystemSettings, updateSystemSettings };

export const adminAPI = {
  getDashboardStats,
  getRecentActivities,
  getSystemHealth,
  exportData,
};

// Schemas & Types
export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().optional(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export interface ActivityItem {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'swap' | 'customer' | 'station' | 'maintenance' | 'alert';
    status?: 'success' | 'warning' | 'error';
}

export interface DashboardStats {
    totalCustomers: { value: number; change: number };
    activeBatteries: { value: number; change: number };
    swapStations: { value: number; change: number };
    monthlyRevenue: { value: number; change: number };
    dailySwaps: { value: number; change:number };
    co2Saved: { value: number; change: number };
}

export interface Rental {
  id: string;
  userName: string;
  batteryCode: string;
  startTime: string;
  endTime: string | null;
  status: string;
}
