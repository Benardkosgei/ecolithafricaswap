import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { SlidersHorizontal } from 'lucide-react';

export function SystemSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Configuration</CardTitle>
        <CardDescription>Global settings for the EcolithSwap platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
          <SlidersHorizontal className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold">Coming Soon</h3>
          <p className="max-w-md">
            This section will house system-wide settings like business hours, API rate limits, notification preferences, and more. Check back for future updates!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
