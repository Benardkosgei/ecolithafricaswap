import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '../lib/api'
import toast from 'react-hot-toast'

// Query keys
const QUERY_KEYS = {
  users: 'users',
  user: (id: string) => ['user', id],
  userStats: 'userStats',
}

// Get users with pagination and filters
export const useUsers = (params?: {
  page?: number
  limit?: number
  search?: string
  role?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.users, params],
    queryFn: () => usersAPI.getUsers(params),
    select: (data) => data.data,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Get single user
export const useUser = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: () => usersAPI.getUser(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Get user statistics
export const useUserStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.userStats],
    queryFn: () => usersAPI.getUserStats(),
    select: (data) => data.data,
    staleTime: 60000, // 1 minute
  })
}

// Update user status mutation
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      usersAPI.updateUserStatus(id, is_active),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.userStats] })
      toast.success('User status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user status')
    },
  })
}

// Update user role mutation
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersAPI.updateUserRole(id, role),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(id) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.userStats] })
      toast.success('User role updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user role')
    },
  })
}

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => usersAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.userStats] })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    },
  })
}

// Bulk update users mutation
export const useBulkUpdateUsers = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ user_ids, update_data }: { user_ids: string[]; update_data: any }) =>
      usersAPI.bulkUpdateUsers(user_ids, update_data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.userStats] })
      toast.success(`${(data as any).data.updated_count} users updated successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update users')
    },
  })
}