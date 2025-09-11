import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function RevenueReportsPage() {
  const { data: revenueData, isLoading: isLoadingRevenue, error: errorRevenue } = useQuery({
    queryKey: ['revenueAnalytics'],
    queryFn: () => paymentsAPI.getRevenueAnalytics('yearly').then(res => res.data),
  });

  const { data: breakdownData, isLoading: isLoadingBreakdown, error: errorBreakdown } = useQuery({
    queryKey: ['revenueBreakdown'],
    queryFn: () => paymentsAPI.getRevenueAnalytics('monthly', 'payment_method').then(res => res.data),
  });

  if (isLoadingRevenue || isLoadingBreakdown) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (errorRevenue || errorBreakdown) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Error Loading Reports</h3>
        <p className="text-gray-500">There was an issue fetching the revenue data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Revenue Reports</h2>
        <p className="text-gray-600 mt-2">
          In-depth analysis of revenue streams and financial performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Monthly Revenue Trend
            </CardTitle>
            <CardDescription>Revenue generated over the past year.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData?.monthly_revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#2E7D32" name="Monthly Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Revenue by Payment Method
            </CardTitle>
            <CardDescription>Breakdown of revenue by how users pay.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={breakdownData?.breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="group"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {breakdownData?.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Detailed Revenue Data
          </CardTitle>
          <CardDescription>Raw data table for monthly revenue figures.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* This would be a data table, for now showing a summary */}
             <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(revenueData, null, 2)}
             </pre>
        </CardContent>
       </Card>
    </div>
  );
}
