import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function UsageAnalyticsPage() {
  const [dateRange, setDateRange] = useState({ from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), to: new Date() });

  const { data: usageData, isLoading } = useQuery({
    queryKey: ['usageAnalytics', dateRange],
    queryFn: () => analyticsAPI.getUsageAnalytics(dateRange.from, dateRange.to).then(res => res.data),
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Usage Analytics Report', 20, 10);

    autoTable(doc, {
        head: [['Metric', 'Value']],
        body: [
            ['Total Swaps', usageData?.totalSwaps],
            ['Average Swaps Per Day', usageData?.averageSwapsPerDay],
        ],
    });
    
    autoTable(doc, {
        head: [['Station', 'Swaps']],
        body: usageData?.stationUsage.map(d => [d.name, d.swaps]),
        startY: (doc as any).lastAutoTable.finalY + 10,
    });

    doc.save('usage_analytics.pdf');
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold">Usage Analytics</h2>
                <p className="text-gray-600">Detailed analysis of station and battery usage.</p>
            </div>
            <div className="flex items-center space-x-4">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                <Button onClick={exportToPDF} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Total Swaps</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{usageData?.totalSwaps.toLocaleString()}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Avg. Swaps Per Day</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{usageData?.averageSwapsPerDay.toFixed(2)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Peak Station</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{usageData?.peakStation.name}</p>
                    <p className="text-gray-500">{usageData?.peakStation.swaps} swaps</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Avg. Battery Health</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{usageData?.averageBatteryHealth}%</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Swap Trends</CardTitle>
                <CardDescription>Daily swap counts over the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={usageData?.swapTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="swaps" stroke="#2E7D32" name="Swaps" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Station Utilization</CardTitle>
                <CardDescription>Number of swaps per station.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageData?.stationUsage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="swaps" fill="#0088FE" name="Swaps" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

    </div>
  );
}
