import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { formatDate } from '../../lib/utils'
import { Activity, Battery, Users, MapPin, AlertTriangle } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'swap' | 'customer' | 'station' | 'maintenance' | 'alert'
  title: string
  description: string
  timestamp: string
  status?: 'success' | 'warning' | 'error'
}

const activityIcons = {
  swap: Battery,
  customer: Users,
  station: MapPin,
  maintenance: Activity,
  alert: AlertTriangle,
}

export function RecentActivity() {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'swap',
      title: 'Battery Swap Completed',
      description: 'Customer #12547 completed swap at Station Downtown Mall',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'success',
    },
    {
      id: '2',
      type: 'customer',
      title: 'New Customer Registration',
      description: 'John Doe registered with premium subscription',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'success',
    },
    {
      id: '3',
      type: 'alert',
      title: 'Low Battery Alert',
      description: 'Station Central Park has only 2 batteries remaining',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'warning',
    },
    {
      id: '4',
      type: 'maintenance',
      title: 'Maintenance Scheduled',
      description: 'Battery #BAT-7829 scheduled for service tomorrow',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      type: 'station',
      title: 'Station Status Update',
      description: 'Station Tech Hub came back online after maintenance',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'success',
    },
  ]

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Success</Badge>
      case 'warning':
        return <Badge variant="warning">Warning</Badge>
      case 'error':
        return <Badge variant="error">Error</Badge>
      default:
        return null
    }
  }

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
          {activities.map((activity) => {
            const IconComponent = activityIcons[activity.type]
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
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
