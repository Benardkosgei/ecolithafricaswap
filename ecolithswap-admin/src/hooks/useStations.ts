import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stationsAPI } from '../lib/api'
import toast from 'react-hot-toast'

// Query keys
const QUERY_KEYS = {
  stations: 'stations',
  station: (id: string) => ['station', id],
  stationStats: 'stationStats',
  nearbyStations: 'nearbyStations',
}

// Get stations with pagination and filters
export const useStations = (params?: {
  page?: number
  limit?: number
  search?: string
  station_type?: string
  is_active?: boolean
  accepts_plastic?: boolean
  maintenance_mode?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.stations, params],
    queryFn: () => stationsAPI.getStations(params),
    select: (data) => data.data,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Get single station
export const useStation = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.station(id),
    queryFn: () => stationsAPI.getStation(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Get station statistics
export const useStationStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.stationStats],
    queryFn: () => stationsAPI.getStationStats(),
    select: (data) => data.data,
    staleTime: 60000, // 1 minute
  })
}

// Create station mutation
export const useCreateStation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: FormData) => stationsAPI.createStation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stations] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stationStats] })
      toast.success('Station created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create station')
    },
  })
}

// Update station mutation
export const useUpdateStation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      stationsAPI.updateStation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stations] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.station(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stationStats] })
      toast.success('Station updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update station')
    },
  })
}

// Delete station mutation
export const useDeleteStation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => stationsAPI.deleteStation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stations] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stationStats] })
      toast.success('Station deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete station')
    },
  })
}

// Toggle maintenance mode mutation
export const useToggleMaintenance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, maintenance_mode, notes }: {
      id: string
      maintenance_mode: boolean
      notes?: string
    }) => stationsAPI.toggleMaintenance(id, maintenance_mode, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stations] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.station(id) })
      toast.success('Maintenance mode updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update maintenance mode')
    },
  })
}

// Bulk update stations mutation
export const useBulkUpdateStations = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ station_ids, update_data }: { station_ids: string[]; update_data: any }) =>
      stationsAPI.bulkUpdateStations(station_ids, update_data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stations] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stationStats] })
      toast.success(`${(data as any).data.updated_count} stations updated successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update stations')
    },
  })
}

// Get nearby stations
export const useNearbyStations = (latitude?: number, longitude?: number, radius?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.nearbyStations, latitude, longitude, radius],
    queryFn: () => stationsAPI.getNearbyStations(latitude!, longitude!, radius),
    select: (data) => data.data,
    enabled: !!(latitude && longitude),
    staleTime: 30000,
  })
}