import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsAPI } from '../lib/api'
import toast from 'react-hot-toast'

// Query keys
const QUERY_KEYS = {
  payments: 'payments',
  payment: (id: string) => ['payment', id],
  paymentStats: 'paymentStats',
  revenueAnalytics: 'revenueAnalytics',
}

// Get payments with pagination and filters
export const usePayments = (params?: {
  page?: number
  limit?: number
  user_id?: string
  status?: string
  payment_method?: string
  start_date?: string
  end_date?: string
  min_amount?: number
  max_amount?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.payments, params],
    queryFn: () => paymentsAPI.getPayments(params),
    select: (data) => data.data,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Get single payment
export const usePayment = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.payment(id),
    queryFn: () => paymentsAPI.getPayment(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Get payment statistics
export const usePaymentStats = (period?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.paymentStats, period],
    queryFn: () => paymentsAPI.getPaymentStats(period),
    select: (data) => data.data,
    staleTime: 60000, // 1 minute
  })
}

// Get revenue analytics
export const useRevenueAnalytics = (period?: string, group_by?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.revenueAnalytics, period, group_by],
    queryFn: () => paymentsAPI.getRevenueAnalytics(period, group_by),
    select: (data) => data.data,
    staleTime: 60000,
  })
}

// Create payment mutation
export const useCreatePayment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => paymentsAPI.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.payments] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.paymentStats] })
      toast.success('Payment created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create payment')
    },
  })
}

// Update payment status mutation
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      paymentsAPI.updatePaymentStatus(id, status, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.payments] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payment(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.paymentStats] })
      toast.success('Payment status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update payment status')
    },
  })
}

// Process refund mutation
export const useProcessRefund = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: { refund_amount?: number; reason: string; refund_method?: string }
    }) => paymentsAPI.processRefund(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.payments] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payment(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.paymentStats] })
      toast.success('Refund processed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to process refund')
    },
  })
}

// Bulk update payments mutation
export const useBulkUpdatePayments = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ payment_ids, update_data }: { payment_ids: string[]; update_data: any }) =>
      paymentsAPI.bulkUpdatePayments(payment_ids, update_data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.payments] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.paymentStats] })
      toast.success(`${(data as any).data.updated_count} payments updated successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update payments')
    },
  })
}

// Export payments data
export const useExportPayments = () => {
  return useMutation({
    mutationFn: (params?: any) => paymentsAPI.exportPayments(params),
    onSuccess: (response) => {
      // Create blob and download
      const blob = new Blob([(response as any).data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Payments data exported successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export payments data')
    },
  })
}