import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

//================================================================================
// Customer Hooks
//================================================================================

/**
 * Fetches a paginated list of customers.
 */
export const useCustomers = (page = 1, limit = 10, filters: { search?: string, role?: string } = {}) => {
  return useQuery({
    queryKey: ['customers', page, limit, filters],
    queryFn: async () => {
      const response = await api.get('/users', { params: { page, limit, ...filters } });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Fetches a single customer by their ID.
 */
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/users/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

/**
 * Creates a new customer.
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCustomer: any) => api.post('/users', newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customerStats'] });
    },
  });
};

/**
 * Updates an existing customer.
 */
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updateData }: { id: string } & any) => api.put(`/users/${id}`, updateData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customerStats'] });
    },
  });
};

/**
 * Deletes a customer by their ID.
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customerStats'] });
    },
  });
};

/**
 * Fetches statistics for all customers.
 */
export const useCustomerStats = () => {
  return useQuery({
    queryKey: ['customerStats'],
    queryFn: () => api.get('/users/stats').then(res => res.data),
  });
};
