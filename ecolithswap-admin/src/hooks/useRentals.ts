import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useRentals = (page = 1, limit = 10, filters: { search?: string } = {}) => {
  return useQuery({
    queryKey: ['rentals', page, limit, filters],
    queryFn: async () => {
      const response = await api.get('/rentals', { params: { page, limit, ...filters } });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
