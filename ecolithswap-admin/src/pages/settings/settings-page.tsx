import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { User, Settings, HeartPulse } from 'lucide-react';
import { ProfileSettings } from './profile-settings';
import { SystemSettings } from './system-settings';
import { SystemHealth } from './system-health';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">
          Manage your account, system configurations, and view system health.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="system">
                <Settings className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
              <TabsTrigger value="health">
                <HeartPulse className="h-4 w-4 mr-2" />
                System Health
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
              <ProfileSettings />
            </TabsContent>
            <TabsContent value="system" className="mt-6">
              <SystemSettings />
            </TabsContent>
            <TabsContent value="health" className="mt-6">
              <SystemHealth />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
