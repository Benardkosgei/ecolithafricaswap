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
    mutationFn: (newStation: Partial<Station>) => api.post('/stations', newStation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
};

/**
 * Updates an existing station.
 */
export const useUpdateStation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedStation: Partial<Station>) => api.put(`/stations/${id}`, updatedStation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['station', id] });
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
    mutationFn: ({ id, is_active }: { id: string, is_active: boolean }) => api.patch(`/stations/${id}/maintenance`, { is_active }),
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
    queryFn: () => api.get('/stations/stats').then(res => res.data),
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
        mutationFn: (stationIds: string[], data: Partial<Station>) => api.post('/stations/bulk-update', { stationIds, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations'] });
        },
    });
};
