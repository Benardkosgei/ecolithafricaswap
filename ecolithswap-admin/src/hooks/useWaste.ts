import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wasteAPI } from '../lib/api'
import toast from 'react-hot-toast'

// Query keys
const QUERY_KEYS = {
  wasteLogs: 'wasteLogs',
  wasteLog: (id: string) => ['wasteLog', id],
  wasteStats: 'wasteStats',
  wasteBreakdown: 'wasteBreakdown',
}

// Get waste logs with pagination and filters
export const useWasteLogs = (params?: {
  page?: number
  limit?: number
  user_id?: string
  plastic_type?: string
  verified?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.wasteLogs, params],
    queryFn: () => wasteAPI.getWasteLogs(params),
    select: (data) => data.data,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Get single waste log
export const useWasteLog = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.wasteLog(id),
    queryFn: () => wasteAPI.getWasteLog(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Get waste statistics
export const useWasteStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.wasteStats],
    queryFn: () => wasteAPI.getWasteStats(),
    select: (data) => data.data,
    staleTime: 60000, // 1 minute
  })
}

// Get waste breakdown by type
export const useWasteBreakdown = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.wasteBreakdown],
    queryFn: () => wasteAPI.getWasteBreakdown(),
    select: (data) => data.data,
    staleTime: 60000,
  })
}

// Create waste log mutation
export const useCreateWasteLog = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: FormData) => wasteAPI.createWasteLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.wasteLogs] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.wasteStats] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.wasteBreakdown] })
      toast.success('Waste submission created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create waste submission')
    },
  })
}

// Verify waste submission mutation
export const useVerifyWaste = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: {
        status: 'verified' | 'rejected'
        verified_weight_kg?: number
        notes?: string
      }
    }) => wasteAPI.verifyWaste(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.wasteLogs] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wasteLog(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.wasteStats] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.wasteBreakdown] })
      toast.success('Waste submission verification updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to verify waste submission')
    },
  })
}

// Export waste data
export const useExportWaste = () => {
  return useMutation({
    mutationFn: (params?: any) => wasteAPI.exportWaste(params),
    onSuccess: (response) => {
      // Create blob and download
      const blob = new Blob([(response as any).data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `waste_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Waste data exported successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export waste data')
    },
  })
}