import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batteriesAPI } from '../lib/api'
import toast from 'react-hot-toast'

// Query keys
const QUERY_KEYS = {
  batteries: 'batteries',
  battery: (id: string) => ['battery', id],
  batteryStats: 'batteryStats',
  batteryAnalytics: 'batteryAnalytics',
  maintenanceNeeded: 'maintenanceNeeded',
}

// Get batteries with pagination and filters
export const useBatteries = (params?: {
  page?: number
  limit?: number
  station_id?: string
  status?: string
  health_status?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.batteries, params],
    queryFn: () => batteriesAPI.getBatteries(params),
    select: (data) => data.data,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Get single battery
export const useBattery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.battery(id),
    queryFn: () => batteriesAPI.getBattery(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Get battery statistics
export const useBatteryStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.batteryStats],
    queryFn: () => batteriesAPI.getBatteryStats(),
    select: (data) => data.data,
    staleTime: 60000, // 1 minute
  })
}

// Get battery analytics
export const useBatteryAnalytics = (period?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.batteryAnalytics, period],
    queryFn: () => batteriesAPI.getBatteryAnalytics(period),
    select: (data) => data.data,
    staleTime: 60000,
  })
}

// Get batteries needing maintenance
export const useBatteriesNeedingMaintenance = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.maintenanceNeeded],
    queryFn: () => batteriesAPI.getBatteriesNeedingMaintenance(),
    select: (data) => data.data,
    staleTime: 30000,
  })
}

// Create battery mutation
export const useCreateBattery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: FormData) => batteriesAPI.createBattery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteries] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteryStats] })
      toast.success('Battery created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create battery')
    },
  })
}

// Update battery mutation
export const useUpdateBattery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      batteriesAPI.updateBattery(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteries] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.battery(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteryStats] })
      toast.success('Battery updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update battery')
    },
  })
}

// Delete battery mutation
export const useDeleteBattery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => batteriesAPI.deleteBattery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteries] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteryStats] })
      toast.success('Battery deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete battery')
    },
  })
}

// Update charge level mutation
export const useUpdateChargeLevel = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, charge_level }: { id: string; charge_level: number }) =>
      batteriesAPI.updateChargeLevel(id, charge_level),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteries] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.battery(id) })
      toast.success('Charge level updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update charge level')
    },
  })
}

// Bulk update batteries mutation
export const useBulkUpdateBatteries = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ battery_ids, update_data }: { battery_ids: string[]; update_data: any }) =>
      batteriesAPI.bulkUpdateBatteries(battery_ids, update_data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteries] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batteryStats] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.maintenanceNeeded] })
      toast.success(`${(data as any).data.updated_count} batteries updated successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update batteries')
    },
  })
}

// Export batteries data
export const useExportBatteries = () => {
  return useMutation({
    mutationFn: (params?: { status?: string; health_status?: string }) =>
      batteriesAPI.exportBatteries(params),
    onSuccess: (response) => {
      // Create blob and download
      const blob = new Blob([(response as any).data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `batteries_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Batteries data exported successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export batteries data')
    },
  })
}