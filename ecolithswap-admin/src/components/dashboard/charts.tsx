import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

// Sample data - would come from API
const swapTrendData = [
  { date: '2025-01-25', swaps: 1045, revenue: 3890 },
  { date: '2025-01-26', swaps: 1124, revenue: 4120 },
  { date: '2025-01-27', swaps: 982, revenue: 3650 },
  { date: '2025-01-28', swaps: 1367, revenue: 4980 },
  { date: '2025-01-29', swaps: 1189, revenue: 4340 },
  { date: '2025-01-30', swaps: 1456, revenue: 5290 },
  { date: '2025-01-31', swaps: 1298, revenue: 4760 },
  { date: '2025-02-01', swaps: 1534, revenue: 5610 },
]

const batteryStatusData = [
  { name: 'Available', value: 4234, color: '#2E7D32' },
  { name: 'In Use', value: 2890, color: '#00796B' },
  { name: 'Charging', value: 1256, color: '#FFC107' },
  { name: 'Maintenance', value: 234, color: '#D32F2F' },
]

const stationPerformanceData = [
  { station: 'Downtown Mall', swaps: 456, efficiency: 92 },
  { station: 'Central Park', swaps: 387, efficiency: 88 },
  { station: 'Tech Hub', swaps: 523, efficiency: 95 },
  { station: 'University', swaps: 298, efficiency: 78 },
  { station: 'Airport', swaps: 634, efficiency: 91 },
  { station: 'Shopping Center', swaps: 412, efficiency: 85 },
]

export function SwapTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Swaps & Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={swapTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                name === 'swaps' ? `${value} swaps` : `$${value}`,
                name === 'swaps' ? 'Battery Swaps' : 'Revenue'
              ]}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="swaps"
              stroke="#2E7D32"
              strokeWidth={2}
              dot={{ fill: '#2E7D32', strokeWidth: 2, r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#00796B"
              strokeWidth={2}
              dot={{ fill: '#00796B', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function BatteryStatusChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Battery Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={batteryStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {batteryStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} batteries`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function StationPerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Station Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stationPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="station" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar yAxisId="left" dataKey="swaps" fill="#2E7D32" name="Daily Swaps" />
            <Bar yAxisId="right" dataKey="efficiency" fill="#00796B" name="Efficiency %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
