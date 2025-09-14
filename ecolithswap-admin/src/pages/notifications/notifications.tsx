import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Bell, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

const fetchNotifications = async () => {
  const { data } = await api.get('/admin/notifications');
  return data;
};

const clearAllNotifications = async () => {
  const { data } = await api.delete('/admin/notifications');
  return data;
};

export function NotificationListPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({ queryKey: ['notifications'], queryFn: fetchNotifications });

  const clearMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications cleared!');
    },
    onError: () => {
      toast.error('Failed to clear notifications.');
    }
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to WebSocket for notifications');
      socket.emit('join-admin');
    });

    socket.on('new-notification', (notification: Notification) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (oldData) => {
        return oldData ? [notification, ...oldData] : [notification];
      });
      toast.info(`New Notification: ${notification.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);


  if (error) return <div>Error fetching notifications.</div>;

  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Real-time System Alerts</CardTitle>
          <Button 
            variant="destructive" 
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || !notifications || notifications.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading notifications...</p>
          ) : notifications && notifications.length > 0 ? (
            <ul className="space-y-4">
              {notifications.map(notification => (
                <li key={notification.id} className="flex items-start p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Bell className="h-6 w-6 mr-4 text-primary" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <Badge variant={notification.type === 'error' ? 'destructive' : 'default'}>
                        {notification.type}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-800 dark:text-gray-200">{notification.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-8">No notifications to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
