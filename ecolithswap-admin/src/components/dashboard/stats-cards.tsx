
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatNumber, formatCurrency } from '../../lib/utils';
import { adminAPI } from '../../lib/api';
import { DashboardStats } from '../../types';
import {
  Users,
  Battery,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Recycle,
  Zap,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  icon: React.ElementType;
  format?: 'number' | 'currency' | 'percentage';
}

function StatCard({ title, value, change, icon: Icon, format = 'number' }: StatCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val}%`;
      default:
        return formatNumber(val);
    }
  };

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
  );
}

export function StatsCards() {
  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await adminAPI.getDashboardStats();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-red-500">
        Error loading dashboard statistics. Please try again later.
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Customers',
      value: data.totalCustomers.value,
      change: { value: data.totalCustomers.change, label: 'from last month', isPositive: data.totalCustomers.change >= 0 },
      icon: Users,
    },
    {
      title: 'Active Batteries',
      value: data.activeBatteries.value,
      change: { value: data.activeBatteries.change, label: 'from last week', isPositive: data.activeBatteries.change >= 0 },
      icon: Battery,
    },
    {
      title: 'Swap Stations',
      value: data.swapStations.value,
      change: { value: data.swapStations.change, label: 'new this month', isPositive: data.swapStations.change >= 0 },
      icon: MapPin,
    },
    {
      title: 'Monthly Revenue',
      value: data.monthlyRevenue.value,
      change: { value: data.monthlyRevenue.change, label: 'from last month', isPositive: data.monthlyRevenue.change >= 0 },
      icon: DollarSign,
      format: 'currency' as const,
    },
    {
      title: 'Daily Swaps',
      value: data.dailySwaps.value,
      change: { value: data.dailySwaps.change, label: 'from yesterday', isPositive: data.dailySwaps.change >= 0 },
      icon: Zap,
    },
    {
      title: 'CO₂ Saved (kg)',
      value: data.co2Saved.value,
      change: { value: data.co2Saved.change, label: 'this month', isPositive: data.co2Saved.change >= 0 },
      icon: Recycle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
