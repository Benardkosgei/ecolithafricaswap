import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Check } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isCurrent: boolean;
}

const mockTiers: PricingTier[] = [
  {
    id: 'tier-basic',
    name: 'Basic',
    price: '$15',
    period: 'per user / month',
    description: 'For small teams getting started.',
    features: [
      'Up to 100 battery swaps',
      'Basic analytics',
      'Email support',
      '2 stations max',
    ],
    isCurrent: false,
  },
  {
    id: 'tier-premium',
    name: 'Premium',
    price: '$35',
    period: 'per user / month',
    description: 'For growing businesses that need more power.',
    features: [
      'Up to 500 battery swaps',
      'Advanced analytics & reporting',
      'Priority email & phone support',
      'Up to 10 stations',
      'API Access',
    ],
    isCurrent: true,
  },
  {
    id: 'tier-enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'Contact us for pricing',
    description: 'For large-scale deployments and custom needs.',
    features: [
      'Unlimited battery swaps',
      'Full analytics suite & custom reports',
      'Dedicated account manager',
      'Unlimited stations',
      'Custom integrations & SLAs',
    ],
    isCurrent: false,
  },
];

export function PricingManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Pricing Management</h2>
          <p className="text-gray-600 mt-2">
            Configure subscription plans and pricing tiers for your users.
          </p>
        </div>
        <Button>Add New Plan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockTiers.map((tier) => (
          <Card key={tier.id} className={tier.isCurrent ? 'border-green-500' : ''}>
            <CardHeader>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-gray-500"> {tier.period}</span>
              </div>
              <ul className="space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={tier.isCurrent ? 'default' : 'outline'}>
                {tier.isCurrent ? 'Current Plan' : 'Edit Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
