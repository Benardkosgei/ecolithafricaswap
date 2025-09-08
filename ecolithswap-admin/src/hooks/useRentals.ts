import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rentalsAPI } from '../lib/api'
import toast from 'react-hot-toast'

// Query keys
const QUERY_KEYS = {
  rentals: 'rentals',
  rental: (id: string) => ['rental', id],
  rentalStats: 'rentalStats',
}

// Get rentals with pagination and filters
export const useRentals = (params?: {
  page?: number
  limit?: number
  user_id?: string
  status?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.rentals, params],
    queryFn: () => rentalsAPI.getRentals(params),
    select: (data) => data.data,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Get single rental
export const useRental = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.rental(id),
    queryFn: () => rentalsAPI.getRental(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Get rental statistics
export const useRentalStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.rentalStats],
    queryFn: () => rentalsAPI.getRentalStats(),
    select: (data) => data.data,
    staleTime: 60000, // 1 minute
  })
}

// Create rental mutation
export const useCreateRental = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { battery_id: string; pickup_station_id: string }) =>
      rentalsAPI.createRental(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rentals] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rentalStats] })
      toast.success('Rental created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create rental')
    },
  })
}

// Return battery mutation
export const useReturnBattery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, return_station_id }: { id: string; return_station_id: string }) =>
      rentalsAPI.returnBattery(id, return_station_id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rentals] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rental(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rentalStats] })
      toast.success('Battery returned successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to return battery')
    },
  })
}

// Cancel rental mutation
export const useCancelRental = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => rentalsAPI.cancelRental(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rentals] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rental(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rentalStats] })
      toast.success('Rental cancelled successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel rental')
    },
  })
}

// Export rentals data
export const useExportRentals = () => {
  return useMutation({
    mutationFn: (params?: any) => rentalsAPI.exportRentals(params),
    onSuccess: (response) => {
      // Create blob and download
      const blob = new Blob([(response as any).data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rentals_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Rentals data exported successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export rentals data')
    },
  })
}