import React from 'react'
import { StatsCards } from '../components/dashboard/stats-cards'
import { RecentActivity } from '../components/dashboard/recent-activity'
import {
  SwapTrendChart,
  BatteryStatusChart,
  StationPerformanceChart,
} from '../components/dashboard/charts'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-2">
          Monitor your EcolithSwap ecosystem performance and key metrics
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SwapTrendChart />
        <BatteryStatusChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StationPerformanceChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
