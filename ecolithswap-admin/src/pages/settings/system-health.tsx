import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { CheckCircle, AlertCircle, Server, Database, Wifi } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

interface HealthStatus {
  status: 'ok' | 'error';
  message: string;
  database: 'ok' | 'error';
  cache: 'ok' | 'error';
  lastChecked: string;
}

export function SystemHealth() {
  const { data: health, isLoading, error } = useQuery<HealthStatus>({
    queryKey: ['systemHealth'],
    queryFn: () => adminAPI.getSystemHealth().then(res => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const StatusIndicator = ({ status }: { status: 'ok' | 'error' | undefined }) => {
    if (status === 'ok') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const StatusBadge = ({ status }: { status: 'ok' | 'error' | undefined }) => {
    const variant = status === 'ok' ? 'success' : 'destructive';
    const text = status === 'ok' ? 'Operational' : 'Issues Detected';
    return <Badge variant={variant}>{text}</Badge>;
  };

  if (isLoading) {
    return <div>Loading system health...</div>;
  }

  if (error) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>An error occurred while fetching system health.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">{error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health Status</CardTitle>
        <CardDescription>
          Real-time status of critical system components. Last checked: {health?.lastChecked ? new Date(health.lastChecked).toLocaleString() : 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Server className="h-6 w-6 mr-4 text-gray-600" />
              <div>
                <h4 className="font-semibold">Overall Status</h4>
                <p className="text-sm text-gray-500">Main API and services</p>
              </div>
            </div>
            <StatusBadge status={health?.status} />
          </div>

          <ul className="divide-y divide-gray-200">
            <li className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-3 text-gray-500" />
                <span>Database Connection</span>
              </div>
              <StatusIndicator status={health?.database} />
            </li>
            <li className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Wifi className="h-5 w-5 mr-3 text-gray-500" />
                <span>Cache Service</span>
              </div>
              <StatusIndicator status={health?.cache} />
            </li>
            {/* Add more service checks here */}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
