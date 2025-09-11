import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Tag } from 'lucide-react';

export function PricingManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Pricing Management</h2>
        <p className="text-gray-600 mt-2">
          Configure subscription plans and pricing tiers for your users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Tiers</CardTitle>
          <CardDescription>Manage and define pricing for different user levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
            <Tag className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">Feature Coming Soon</h3>
            <p className="max-w-md">
              This section will allow for dynamic management of pricing plans, including setting up new tiers, defining features for each plan, and adjusting costs. Stay tuned for this powerful addition!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
