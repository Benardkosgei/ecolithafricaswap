import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getStatusColor(status: string) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    'in-use': 'bg-blue-100 text-blue-800',
    charging: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    open: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
    resolved: 'bg-green-100 text-green-800',
  }
  
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

export function calculateCO2Savings(batterySwaps: number) {
  // Assuming each battery swap saves approximately 2.3 kg of CO2
  return batterySwaps * 2.3
}

export function calculatePlasticRecycled(plasticWeight: number) {
  // Convert grams to kilograms
  return plasticWeight / 1000
}
