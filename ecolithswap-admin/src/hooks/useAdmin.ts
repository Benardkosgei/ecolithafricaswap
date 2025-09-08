import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../lib/api'

// Query keys
const QUERY_KEYS = {
  dashboardStats: 'dashboardStats',
  recentActivities: 'recentActivities',
  revenueAnalytics: 'revenueAnalytics',
  usageAnalytics: 'usageAnalytics',
  systemHealth: 'systemHealth',
}

// Get dashboard statistics
export const useDashboardStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboardStats],
    queryFn: () => adminAPI.getDashboardStats(),
    select: (data) => data.data,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  })
}

// Get recent activities
export const useRecentActivities = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.recentActivities, limit],
    queryFn: () => adminAPI.getRecentActivities(limit),
    select: (data) => data.data,
    staleTime: 30000,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
  })
}

// Get revenue analytics
export const useRevenueAnalytics = (period?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.revenueAnalytics, period],
    queryFn: () => adminAPI.getRevenueAnalytics(period),
    select: (data) => data.data,
    staleTime: 60000, // 1 minute
  })
}

// Get usage analytics
export const useUsageAnalytics = (period?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.usageAnalytics, period],
    queryFn: () => adminAPI.getUsageAnalytics(period),
    select: (data) => data.data,
    staleTime: 60000,
  })
}

// Get system health
export const useSystemHealth = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.systemHealth],
    queryFn: () => adminAPI.getSystemHealth(),
    select: (data) => data.data,
    staleTime: 30000,
    refetchInterval: 60000, // Check health every minute
  })
}