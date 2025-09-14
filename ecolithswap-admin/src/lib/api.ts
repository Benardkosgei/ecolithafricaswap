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
const getUsageAnalytics = (period: string) => api.get('/admin/usage-analytics', { params: { period } });


// Batteries
const getBatteries = (params: object) => api.get('/batteries', { params });
const getBattery = (id: string) => api.get(`/batteries/${id}`);
const createBattery = (data: object) => api.post('/batteries', data);
const updateBattery = (id: string, data: object) => api.put(`/batteries/${id}`, data);
const deleteBattery = (id: string) => api.delete(`/batteries/${id}`);
const getBatteryStats = () => api.get('/batteries/stats');

// Stations
const getStations = (params: object) => api.get('/stations', { params });
const getStation = (id: string) => api.get(`/stations/${id}`);
const createStation = (data: object) => api.post('/stations', data);
const updateStation = (id: string, data: object) => api.put(`/stations/${id}`, data);
const deleteStation = (id: string) => api.delete(`/stations/${id}`);
const getStationStatsOverview = () => api.get('/stations/stats/overview');

// Support
const getTickets = (params: object) => api.get('/support/tickets', { params });
const getTicket = (id: string) => api.get(`/support/tickets/${id}`);
const createTicket = (data: object) => api.post('/support/tickets', data);
const updateTicket = (id: string, data: object) => api.put(`/support/tickets/${id}`, data);
const getTicketMessages = (ticketId: string) => api.get(`/support/tickets/${ticketId}/messages`);
const addTicketMessage = (ticketId: string, data: object) => api.post(`/support/tickets/${ticketId}/messages`, data);

// Rentals
const getRentals = (params: object) => api.get('/rentals', { params });

// Payments
const getPayments = (params: object) => api.get('/payments', { params });

// Environmental
const getWasteSubmissions = () => api.get('/environmental/waste-submissions');
const updateSubmissionStatus = (id: string, status: string) => api.patch(`/environmental/waste-submissions/${id}`, { status });

// Analytics
const getUsageAnalyticsByDate = (from: Date, to: Date) => api.get('/analytics/usage-by-date', { params: { from, to }});


// API Exports
export { api };
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
  getUsageAnalytics,
};

export const batteriesAPI = {
    getBatteries,
    getBattery,
    createBattery,
    updateBattery,
    deleteBattery,
    getBatteryStats,
};

export const stationsAPI = {
    getStations,
    getStation,
    createStation,
    updateStation,
    deleteStation,
    getStationStatsOverview,
};

export const supportAPI = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  getTicketMessages,
  addTicketMessage
};

export const rentalsAPI = { getRentals };
export const paymentsAPI = { getPayments };

export const environmentalAPI = {
  getWasteSubmissions,
  updateSubmissionStatus,
};

export const analyticsAPI = {
    getUsageAnalytics: getUsageAnalyticsByDate
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

export interface SupportTicket {
  id: string;
  subject: string;
  user: { name: string; };
  status: string;
  priority: string;
  updatedAt: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}