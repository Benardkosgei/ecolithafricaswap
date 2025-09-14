
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate } from '../../lib/utils';
import { adminAPI, ActivityItem } from '../../lib/api';
import { Activity, Battery, Users, MapPin, AlertTriangle } from 'lucide-react';

const activityIcons = {
  swap: Battery,
  customer: Users,
  station: MapPin,
  maintenance: Activity,
  alert: AlertTriangle,
};

export function RecentActivity() {
  const { data: activities, isLoading, isError } = useQuery<ActivityItem[]>(
    {
      queryKey: ['recentActivities'],
      queryFn: async () => {
        const response = await adminAPI.getRecentActivities(5);
        return response.data;
      }
    }
  );

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) return <div>Loading activities...</div>;
  if (isError) return <div>Error loading activities.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2 text-[#2E7D32]" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity) => {
            const IconComponent = activityIcons[activity.type];
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <IconComponent className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    {activity.status && getStatusBadge(activity.status)}
                  </div>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
