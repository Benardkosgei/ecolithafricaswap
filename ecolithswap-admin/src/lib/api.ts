import axios from 'axios'

// API Configuration
// Use environment variable or fallback to localhost (backend must be running locally)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Types
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface EnvironmentalImpact {
  co2Saved: {
    value: number
    change: number
  }
  plasticRecycled: {
    value: number
    change: number
  }
  energySaved: {
    value: number
    change: number
  }
  treesEquivalent: number
  monthlyData: {
    month: string
    co2Saved: number
    plasticRecycled: number
    swaps: number
  }[]
  weeklyData: {
    day: string
    co2: number
    plastic: number
    energy: number
  }[]
  summary: {
    carbon: {
      total: number
      carsOffRoad: number
      treesEquivalent: number
    }
    plastic: {
      total: number
      bottlesDiverted: number
      oceanPlasticPrevented: number
    }
    energy: {
      total: number
      homesPowered: number
      coalAvoided: number
    }
  }
}

export interface FinancialOverview {
  totalRevenue: {
    value: number
    change: number
  }
  transactions: {
    value: number
    change: number
  }
  avgTransaction: {
    value: number
    change: number
  }
  monthlyGrowth: {
    value: number
    vsLastMonth: number
  }
  revenueData: {
    month: string
    revenue: number
    transactions: number
    avgTransaction: number
  }[]
  paymentMethodData: {
    name: string
    value: number
    color: string
  }[]
  dailyRevenueData: {
    day: string
    revenue: number
    swaps: number
  }[]
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  premiumCustomers: number
  avgLoyaltyPoints: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  subscriptionType: string
  subscriptionStatus: string
  totalSwaps: number
  loyaltyPoints: number
  totalSpent: number
  registrationDate: string
  lastSwapDate: string
  isVerified: boolean
}

export interface Battery {
  id: string
  serialNumber: string
  model: string
  capacityMah: number
  chargeLevel: number
  healthPercentage: number
  status: string
  stationName?: string
  lastService: string
  totalCycles: number
}

export interface BatteryStats {
  totalBatteries: number
  availableBatteries: number
  inUseBatteries: number
  chargingBatteries: number
}

export interface MaintenanceTask {
  id: string;
  batteryId: string;
  serviceDate: string;
  technician: string;
  status: 'pending' | 'in-progress' | 'completed';
  notes: string;
}

export interface SupportTicket {
  id: string;
  user: Customer;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  messages: { sender: string; content: string; timestamp: string }[];
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  getProfile: () => api.get('/auth/profile'),
}

// Users API
export const usersAPI = {
  getUsers: (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => api.get<PaginationResponse<Customer>>('/users', { params }),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  updateUserStatus: (id: string, is_active: boolean) =>
    api.patch(`/users/${id}/status`, { is_active }),
  
  updateUserRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  
  getUserStats: () => api.get<CustomerStats>('/users/stats/overview'),
  
  bulkUpdateUsers: (user_ids: string[], update_data: any) =>
    api.patch('/users/bulk/update', { user_ids, update_data }),
}

// Stations API
export const stationsAPI = {
  getStations: (params?: {
    page?: number
    limit?: number
    search?: string
    station_type?: string
    is_active?: boolean
    accepts_plastic?: boolean
    maintenance_mode?: boolean
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => api.get('/stations', { params }),
  
  getStation: (id: string) => api.get(`/stations/${id}`),
  
  createStation: (data: FormData) => api.post('/stations', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  updateStation: (id: string, data: FormData) => api.put(`/stations/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  deleteStation: (id: string) => api.delete(`/stations/${id}`),
  
  toggleMaintenance: (id: string, maintenance_mode: boolean, notes?: string) =>
    api.patch(`/stations/${id}/maintenance`, { maintenance_mode, maintenance_notes: notes }),
  
  bulkUpdateStations: (station_ids: string[], update_data: any) =>
    api.patch('/stations/bulk/update', { station_ids, update_data }),
  
  getStationStats: () => api.get('/stations/stats/overview'),
  
  getNearbyStations: (latitude: number, longitude: number, radius?: number) =>
    api.get(`/stations/nearby/${latitude}/${longitude}`, { params: { radius } }),
}

// Batteries API
export const batteriesAPI = {
  getBatteries: (params?: {
    page?: number
    limit?: number
    station_id?: string
    status?: string
    health_status?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => api.get<PaginationResponse<Battery>>('/batteries', { params }),
  
  getBattery: (id: string) => api.get(`/batteries/${id}`),
  
  createBattery: (data: FormData) => api.post('/batteries', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  updateBattery: (id: string, data: FormData) => api.put(`/batteries/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  deleteBattery: (id: string) => api.delete(`/batteries/${id}`),
  
  updateChargeLevel: (id: string, charge_level: number) =>
    api.patch(`/batteries/${id}/charge`, { charge_level }),
  
  bulkUpdateBatteries: (battery_ids: string[], update_data: any) =>
    api.patch('/batteries/bulk/update', { battery_ids, update_data }),
  
  getBatteryStats: () => api.get<BatteryStats>('/batteries/stats/overview'),
  
  getBatteriesNeedingMaintenance: () => api.get<PaginationResponse<Battery>>('/batteries/maintenance/needed'),

  scheduleMaintenance: (batteryId: string, data: { serviceDate: string; technician: string; notes?: string }) => api.post<MaintenanceTask>(`/batteries/${batteryId}/maintenance`, data),
  
  getBatteryAnalytics: (period?: string) =>
    api.get('/batteries/analytics/performance', { params: { period } }),
  
  exportBatteries: (params?: { status?: string; health_status?: string }) =>
    api.get('/batteries/export/csv', { params, responseType: 'blob' }),
}

// Rentals API
export const rentalsAPI = {
  getRentals: (params?: {
    page?: number
    limit?: number
    user_id?: string
    status?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => api.get('/rentals', { params }),
  
  getRental: (id: string) => api.get(`/rentals/${id}`),
  
  createRental: (data: { battery_id: string; pickup_station_id: string }) =>
    api.post('/rentals', data),
  
  returnBattery: (id: string, return_station_id: string) =>
    api.patch(`/rentals/${id}/return`, { return_station_id }),
  
  cancelRental: (id: string) => api.patch(`/rentals/${id}/cancel`),
  
  getRentalStats: () => api.get('/rentals/stats/overview'),
  
  exportRentals: (params?: any) => api.get('/rentals/export/csv', { params, responseType: 'blob' }),
}

// Waste API
export const wasteAPI = {
  getWasteLogs: (params?: {
    page?: number
    limit?: number
    user_id?: string
    plastic_type?: string
    verified?: boolean
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => api.get('/waste', { params }),
  
  getWasteLog: (id: string) => api.get(`/waste/${id}`),
  
  createWasteLog: (data: FormData) => api.post('/waste', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  verifyWaste: (id: string, data: {
    status: 'verified' | 'rejected'
    verified_weight_kg?: number
    notes?: string
  }) => api.patch(`/waste/${id}/verify`, data),
  
  getWasteStats: () => api.get('/waste/stats/overview'),
  
  getWasteBreakdown: () => api.get('/waste/stats/breakdown'),
  
  exportWaste: (params?: any) => api.get('/waste/export/csv', { params, responseType: 'blob' }),
}

// Payments API
export const paymentsAPI = {
  getPayments: (params?: {
    page?: number
    limit?: number
    user_id?: string
    status?: string
    payment_method?: string
    start_date?: string
    end_date?: string
    min_amount?: number
    max_amount?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => api.get('/payments', { params }),
  
  getPayment: (id: string) => api.get(`/payments/${id}`),
  
  createPayment: (data: any) => api.post('/payments', data),
  
  updatePaymentStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/payments/${id}/status`, { status, notes }),
  
  processRefund: (id: string, data: {
    refund_amount?: number
    reason: string
    refund_method?: string
  }) => api.post(`/payments/${id}/refund`, data),
  
  bulkUpdatePayments: (payment_ids: string[], update_data: any) =>
    api.patch('/payments/bulk/update', { payment_ids, update_data }),
  
  getPaymentStats: (period?: string) => api.get('/payments/stats/overview', { params: { period } }),
  
  getRevenueAnalytics: (period?: string, group_by?: string) =>
    api.get('/payments/analytics/revenue', { params: { period, group_by } }),
  
  exportPayments: (params?: any) => api.get('/payments/export/csv', { params, responseType: 'blob' }),
}

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  getRecentActivities: (limit?: number) => api.get('/admin/activities', { params: { limit } }),
  
  getRevenueAnalytics: (period?: string) => api.get('/admin/analytics/revenue', { params: { period } }),
  
  getUsageAnalytics: (period?: string) => api.get('/admin/analytics/usage', { params: { period } }),
  
  getEnvironmentalImpact: (period?: string) => api.get<EnvironmentalImpact>('/admin/analytics/environmental', { params: { period } }),

  getFinancialOverview: (period?: string) => api.get<FinancialOverview>('/admin/analytics/financial-overview', { params: { period } }),
  
  getSystemHealth: () => api.get('/admin/health'),
  
  exportData: (type: string, params?: any) => api.get(`/admin/export/${type}`, { params, responseType: 'blob' }),
}

// File Upload API
export const filesAPI = {
  uploadWastePhotos: (files: FileList) => {
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('photos', file))
    return api.post('/files/waste-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  uploadStationImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/files/station-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  uploadBatteryImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/files/battery-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  uploadProfileAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/files/profile-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  deleteFile: (category: string, filename: string) =>
    api.delete(`/files/delete/${category}/${filename}`),
  
  getFileInfo: (category: string, filename: string) =>
    api.get(`/files/info/${category}/${filename}`),
}

// User Profiles API
export const userProfilesAPI = {
  getProfile: (userId: string) => api.get(`/profiles/${userId}`),
  
  updateProfile: (userId: string, data: FormData) =>
    api.put(`/profiles/${userId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getUserActivity: (userId: string, period?: string) =>
    api.get(`/profiles/${userId}/activity`, { params: { period } }),
  
  updateUserPoints: (userId: string, data: { points_adjustment: number; reason: string }) =>
    api.patch(`/profiles/${userId}/points`, data),
  
  getPointsHistory: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/profiles/${userId}/points/history`, { params }),
}

export const supportAPI = {
  getTickets: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }) => api.get<PaginationResponse<SupportTicket>>('/support/tickets', { params }),

  getTicket: (id: string) => api.get<SupportTicket>(`/support/tickets/${id}`),

  createTicket: (data: { userId: string; subject: string; message: string; priority: string }) =>
    api.post<SupportTicket>('/support/tickets', data),

  replyToTicket: (id: string, message: string) =>
    api.post<SupportTicket>(`/support/tickets/${id}/reply`, { message }),

  updateTicketStatus: (id: string, status: string) =>
    api.patch<SupportTicket>(`/support/tickets/${id}/status`, { status }),
};

// Analytics API
export const analyticsAPI = {
  getUsageAnalytics: (period?: string) =>
    api.get('/analytics/usage', { params: { period } }),
  
  getUserAnalytics: (period?: string) =>
    api.get('/analytics/user', { params: { period } }),

  getGeographicAnalysis: (period?: string) =>
    api.get('/analytics/geographic', { params: { period } }),
};

// Environmental API
export const environmentalAPI = {
  getEnvironmentalImpact: (period?: string) =>
    api.get<EnvironmentalImpact>('/environmental/impact', { params: { period } }),

  getLeaderboard: (params?: PaginationParams) =>
    api.get('/environmental/leaderboard', { params }),

  getWasteSubmissions: (params?: PaginationParams) =>
    api.get('/environmental/waste-submissions', { params }),
};

// Settings API
export const settingsAPI = {
  getApiKeys: (params?: PaginationParams) =>
    api.get('/settings/api-keys', { params }),
  
  createApiKey: (data: { name: string; expires_in_days: number }) =>
    api.post('/settings/api-keys', data),

  deleteApiKey: (id: string) =>
    api.delete(`/settings/api-keys/${id}`),

  getAuditLogs: (params?: PaginationParams & { user_id?: string; action?: string }) =>
    api.get('/settings/audit-logs', { params }),

  getBillingHistory: (params?: PaginationParams) =>
    api.get('/settings/billing-history', { params }),
  
  updateSubscription: (data: { plan_id: string }) =>
    api.post('/settings/subscription', data),

  getSystemSettings: () =>
    api.get('/settings/system'),
  
  updateSystemSettings: (data: any) =>
    api.patch('/settings/system', data),
};

export default api
