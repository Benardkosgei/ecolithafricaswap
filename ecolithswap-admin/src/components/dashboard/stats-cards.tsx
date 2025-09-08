import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatNumber, formatCurrency } from '../../lib/utils'
import {
  Users,
  Battery,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Recycle,
  Zap,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    label: string
    isPositive: boolean
  }
  icon: React.ElementType
  format?: 'number' | 'currency' | 'percentage'
}

function StatCard({ title, value, change, icon: Icon, format = 'number' }: StatCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return `${val}%`
      default:
        return formatNumber(val)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-[#2E7D32]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </div>
        {change && (
          <div className="flex items-center mt-1">
            {change.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span
              className={`text-xs ${
                change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change.isPositive ? '+' : ''}{change.value}% {change.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  // This would normally come from API calls
  const stats = [
    {
      title: 'Total Customers',
      value: 12547,
      change: { value: 12.5, label: 'from last month', isPositive: true },
      icon: Users,
    },
    {
      title: 'Active Batteries',
      value: 8924,
      change: { value: 8.2, label: 'from last week', isPositive: true },
      icon: Battery,
    },
    {
      title: 'Swap Stations',
      value: 156,
      change: { value: 3, label: 'new this month', isPositive: true },
      icon: MapPin,
    },
    {
      title: 'Monthly Revenue',
      value: 245890,
      change: { value: 15.3, label: 'from last month', isPositive: true },
      icon: DollarSign,
      format: 'currency' as const,
    },
    {
      title: 'Daily Swaps',
      value: 1247,
      change: { value: 5.7, label: 'from yesterday', isPositive: true },
      icon: Zap,
    },
    {
      title: 'CO₂ Saved (kg)',
      value: 28640,
      change: { value: 11.2, label: 'this month', isPositive: true },
      icon: Recycle,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
