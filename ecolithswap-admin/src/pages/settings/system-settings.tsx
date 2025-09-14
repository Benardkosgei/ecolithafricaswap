import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Clock, Zap, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const settingsSchema = z.object({
  businessHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  }),
  apiRateLimit: z.number().min(1, 'Rate limit must be at least 1'),
  notifications: z.object({
    newSignups: z.boolean(),
    stationAlerts: z.boolean(),
    lowBatteryWarnings: z.boolean(),
  }),
});

type SystemSettingsForm = z.infer<typeof settingsSchema>;

export function SystemSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError } = useQuery<SystemSettingsForm>({
    queryKey: ['systemSettings'],
    queryFn: () => systemSettingsAPI.getSystemSettings().then(res => res.data),
  });

  const { control, handleSubmit, formState: { errors } } = useForm<SystemSettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settings || {
      businessHours: { start: '09:00', end: '17:00' },
      apiRateLimit: 100,
      notifications: { newSignups: true, stationAlerts: true, lowBatteryWarnings: false },
    },
  });

  const updateSettingsMutation = useMutation<any, Error, SystemSettingsForm>({
    mutationFn: (data) => systemSettingsAPI.updateSystemSettings(data),
    onSuccess: () => {
      toast.success('System settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const onSubmit = (data: SystemSettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) return <div>Loading system settings...</div>;
  if (isError) return <div>Error loading settings.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Configuration</CardTitle>
        <CardDescription>Global settings for the EcolithSwap platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Business Hours */}
          <div className="space-y-4">
             <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-gray-500" />
                <h3 className="text-lg font-medium">Business Hours</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
              <Controller
                name="businessHours.start"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-sm font-medium">Start Time</label>
                    <Input {...field} type="time" className="mt-1"/>
                    {errors.businessHours?.start && <p className="text-red-500 text-xs mt-1">{errors.businessHours.start.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="businessHours.end"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-sm font-medium">End Time</label>
                    <Input {...field} type="time" className="mt-1"/>
                     {errors.businessHours?.end && <p className="text-red-500 text-xs mt-1">{errors.businessHours.end.message}</p>}
                  </div>
                )}
              />
            </div>
          </div>

          {/* API Rate Limit */}
           <div className="space-y-4">
             <div className="flex items-center">
                <Zap className="h-5 w-5 mr-3 text-gray-500" />
                <h3 className="text-lg font-medium">API Rate Limit</h3>
            </div>
             <div className="pl-8">
                <Controller
                    name="apiRateLimit"
                    control={control}
                    render={({ field }) => (
                    <div>
                        <label className="text-sm font-medium">Requests per minute</label>
                        <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value, 10))} className="mt-1 max-w-xs"/>
                        {errors.apiRateLimit && <p className="text-red-500 text-xs mt-1">{errors.apiRateLimit.message}</p>}
                    </div>
                    )}
                />
             </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <div className="flex items-center">
                <Bell className="h-5 w-5 mr-3 text-gray-500" />
                <h3 className="text-lg font-medium">Notification Preferences</h3>
            </div>
            <div className="space-y-3 pl-8">
                <Controller
                    name="notifications.newSignups"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center justify-between">
                            <label htmlFor="newSignups" className="text-sm font-medium">New user sign-ups</label>
                            <Switch id="newSignups" checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                    )}
                />
                <Controller
                    name="notifications.stationAlerts"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center justify-between">
                            <label htmlFor="stationAlerts" className="text-sm font-medium">Critical station alerts (e.g., offline)</label>
                            <Switch id="stationAlerts" checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                    )}
                />
                 <Controller
                    name="notifications.lowBatteryWarnings"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center justify-between">
                            <label htmlFor="lowBatteryWarnings" className="text-sm font-medium">Low battery warnings (below 20%)</label>
                            <Switch id="lowBatteryWarnings" checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                    )}
                />
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
