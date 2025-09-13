
import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { adminAPI, batteriesAPI, stationsAPI } from '../../lib/api';
import { AnalyticsData, BatteryStatus, StationPerformance } from '../../types';

export function SwapTrendChart() {
  const { data, isLoading, isError } = useQuery<AnalyticsData[]>(
    {
      queryKey: ['swapTrend'],
      queryFn: async () => {
        const response = await adminAPI.getUsageAnalytics('weekly');
        return response.data;
      }
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading chart data.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Swaps & Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
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
  );
}

export function BatteryStatusChart() {
  const { data, isLoading, isError } = useQuery<BatteryStatus[]>(
    {
      queryKey: ['batteryStatus'],
      queryFn: async () => {
        const response = await batteriesAPI.getBatteryStats();
        return response.data;
      }
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading chart data.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Battery Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} batteries`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function StationPerformanceChart() {
  const { data, isLoading, isError } = useQuery<StationPerformance[]>(
    {
      queryKey: ['stationPerformance'],
       queryFn: async () => {
        const response = await stationsAPI.getStationStatsOverview();
        const stats = response.data;
        return [
          { station: 'Total', swaps: stats.totalStations, efficiency: 100 },
          { station: 'Active', swaps: stats.activeStations, efficiency: 0 },
          { station: 'Maintenance', swaps: stats.maintenanceStations, efficiency: 0 },
        ];
      }
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading chart data.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Station Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="station" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar yAxisId="left" dataKey="swaps" fill="#2E7D32" name="Count" />
            <Bar yAxisId="right" dataKey="efficiency" fill="#00796B" name="Efficiency %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
