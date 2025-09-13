import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Station } from '../types';

//================================================================================
// Stations Hooks
//================================================================================

/**
 * Fetches a paginated list of stations.
 */
export const useStations = (page = 1, limit = 10, filters = {}) => {
  return useQuery({
    queryKey: ['stations', page, limit, filters],
    queryFn: () => api.get('/stations', { params: { page, limit, ...filters } }).then(res => res.data),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Fetches a single station by its ID.
 */
export const useStation = (id: string) => {
  return useQuery({
    queryKey: ['station', id],
    queryFn: () => api.get(`/stations/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

/**
 * Creates a new station.
 */
export const useCreateStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newStation: FormData) => api.post('/stations', newStation, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
};

/**
 * Updates an existing station.
 */
export const useUpdateStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.put(`/stations/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['station', variables.id] });
    },
  });
};

/**
 * Deletes a station by its ID.
 */
export const useDeleteStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/stations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
};

/**
 * Toggles the maintenance mode for a station.
 */
export const useToggleMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, maintenance_mode }: { id: string, maintenance_mode: boolean }) => api.patch(`/stations/${id}/maintenance`, { maintenance_mode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
};


//================================================================================
// Station Statistics Hooks
//================================================================================

/**
 * Fetches statistics for all stations.
 */
export const useStationStats = () => {
  return useQuery({
    queryKey: ['stationStats'],
    queryFn: () => api.get('/stations/stats/overview').then(res => res.data),
  });
};


//================================================================================
// Bulk Actions
//================================================================================

/**
 * Updates multiple stations at once.
 */
export const useBulkUpdateStations = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ station_ids, update_data }: { station_ids: string[], update_data: Partial<Station> }) => api.patch('/stations/bulk/update', { station_ids, update_data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations'] });
        },
    });
};
