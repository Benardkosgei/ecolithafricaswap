import React from 'react'
import { Badge, BadgeProps } from './badge'
import { cn } from '../../lib/utils'

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string
  type?: 'user' | 'station' | 'battery' | 'rental' | 'payment' | 'waste'
}

const statusVariants = {
  user: {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-red-100 text-red-800 border-red-300',
    customer: 'bg-blue-100 text-blue-800 border-blue-300',
    admin: 'bg-purple-100 text-purple-800 border-purple-300',
    station_manager: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  station: {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-red-100 text-red-800 border-red-300',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    swap: 'bg-blue-100 text-blue-800 border-blue-300',
    charge: 'bg-purple-100 text-purple-800 border-purple-300',
    both: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  battery: {
    available: 'bg-green-100 text-green-800 border-green-300',
    rented: 'bg-blue-100 text-blue-800 border-blue-300',
    charging: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    maintenance: 'bg-orange-100 text-orange-800 border-orange-300',
    retired: 'bg-gray-100 text-gray-800 border-gray-300',
    excellent: 'bg-green-100 text-green-800 border-green-300',
    good: 'bg-blue-100 text-blue-800 border-blue-300',
    fair: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    poor: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  },
  rental: {
    active: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
    overdue: 'bg-red-100 text-red-800 border-red-300',
  },
  payment: {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
    refunded: 'bg-purple-100 text-purple-800 border-purple-300',
    mpesa: 'bg-green-100 text-green-800 border-green-300',
    card: 'bg-blue-100 text-blue-800 border-blue-300',
    cash: 'bg-gray-100 text-gray-800 border-gray-300',
    points: 'bg-purple-100 text-purple-800 border-purple-300',
    bank_transfer: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  waste: {
    verified: 'bg-green-100 text-green-800 border-green-300',
    pending_verification: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    PET: 'bg-blue-100 text-blue-800 border-blue-300',
    HDPE: 'bg-green-100 text-green-800 border-green-300',
    PVC: 'bg-red-100 text-red-800 border-red-300',
    LDPE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    PP: 'bg-purple-100 text-purple-800 border-purple-300',
    PS: 'bg-orange-100 text-orange-800 border-orange-300',
    OTHER: 'bg-gray-100 text-gray-800 border-gray-300',
  },
}

const getStatusText = (status: string, type?: string) => {
  // Convert status to display text
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    case 'pending_verification':
      return 'Pending'
    case 'station_manager':
      return 'Manager'
    case 'bank_transfer':
      return 'Bank Transfer'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'user',
  className,
  ...props
}) => {
  const statusKey = status.toLowerCase()
  const variants = statusVariants[type] || statusVariants.user
  const variant = variants[statusKey as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-300'
  
  return (
    <Badge
      className={cn(
        'border font-medium',
        variant,
        className
      )}
      {...props}
    >
      {getStatusText(status, type)}
    </Badge>
  )
}