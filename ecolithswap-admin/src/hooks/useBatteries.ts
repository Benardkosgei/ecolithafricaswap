import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Battery, BatteryStats } from '../../types/battery';

interface BatteryFilters {
  search?: string;
  status?: string;
  health_status?: string;
  station_id?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedBatteriesResponse {
    batteries: Battery[];
    pagination: Pagination;
}

//================================================================================
// Battery Hooks
//================================================================================

/**
 * Fetches a paginated list of batteries with optional filters.
 */
export const useBatteries = (page = 1, limit = 10, filters: BatteryFilters = {}) => {
  return useQuery<PaginatedBatteriesResponse>({
    queryKey: ['batteries', page, limit, filters],
    queryFn: async () => {
      const response = await api.get('/batteries', { 
        params: { page, limit, ...filters }
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Fetches a single battery by its ID.
 */
export const useBattery = (id: string) => {
  return useQuery<Battery>({
    queryKey: ['battery', id],
    queryFn: () => api.get(`/batteries/${id}`).then(res => res.data.battery),
    enabled: !!id,
  });
};

/**
 * Creates a new battery. Expects formData for file upload.
 */
export const useCreateBattery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.post('/batteries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteries'] });
      queryClient.invalidateQueries({ queryKey: ['batteryStats'] });
    },
  });
};

/**
 * Updates an existing battery. Expects formData for file upload.
 */
export const useUpdateBattery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string, formData: FormData }) => api.put(`/batteries/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batteries'] });
      queryClient.invalidateQueries({ queryKey: ['battery', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['batteryStats'] });
    },
  });
};

/**
 * Deletes a battery by its ID.
 */
export const useDeleteBattery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/batteries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteries'] });
      queryClient.invalidateQueries({ queryKey: ['batteryStats'] });
    },
  });
};

/**
 * Fetches statistics for all batteries.
 */
export const useBatteryStats = () => {
  return useQuery<BatteryStats[]>({
    queryKey: ['batteryStats'],
    queryFn: () => api.get('/batteries/stats/overview').then(res => res.data),
  });
};

/**
 * Fetches batteries that need maintenance.
 */
export const useMaintenanceBatteries = () => {
  return useQuery<Battery[]>({
    queryKey: ['maintenanceBatteries'],
    queryFn: () => api.get('/batteries/maintenance/needed').then(res => res.data.batteries),
  });
};
