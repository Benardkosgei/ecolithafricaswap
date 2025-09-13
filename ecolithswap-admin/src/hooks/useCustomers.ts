import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Customer } from '../types';

/**
 * Fetches a paginated list of customers.
 */
export const useCustomers = (page = 1, limit = 10, filters = {}) => {
  return useQuery({
    queryKey: ['customers', page, limit, filters],
    queryFn: () => api.get('/customers', { params: { page, limit, ...filters } }).then(res => res.data),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Fetches statistics for all customers.
 */
export const useCustomerStats = () => {
  return useQuery({
    queryKey: ['customerStats'],
    queryFn: () => api.get('/customers/stats').then(res => res.data),
  });
};

/**
 * Fetches a single customer by its ID.
 */
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

/**
 * Creates a new customer.
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCustomer: Partial<Customer>) => api.post('/customers', newCustomer),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => api.put(`/customers/${id}`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
};

/**
 * Deletes a customer by its ID.
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customerStats'] });
    },
  });
};
