import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UserActivity {
    id: string;
    name: string;
    totalSwaps: number;
    lastSeen: string;
}

export function UserAnalyticsPage() {
  const [dateRange, setDateRange] = useState({ from: new Date(new Date().setMonth(new Date().getMonth() - 1)), to: new Date() });

  const { data: userAnalytics, isLoading } = useQuery({
    queryKey: ['userAnalytics', dateRange],
    queryFn: () => analyticsAPI.getUserAnalytics(dateRange.from, dateRange.to).then(res => res.data),
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('User Analytics Report', 20, 10);
    autoTable(doc, {
        head: [['Metric', 'Value']],
        body: [
            ['Active Users', userAnalytics?.activeUsers],
            ['New Users', userAnalytics?.newUsers],
            ['Retention Rate', `${userAnalytics?.retentionRate}%`],
        ],
    });
    autoTable(doc, {
        head: [['Name', 'Total Swaps', 'Last Seen']],
        body: userAnalytics?.topUsers.map(u => [u.name, u.totalSwaps, new Date(u.lastSeen).toLocaleDateString()]),
        startY: (doc as any).lastAutoTable.finalY + 10,
    });
    doc.save('user_analytics.pdf');
  };

  const columns: ColumnDef<UserActivity>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'totalSwaps', header: 'Total Swaps' },
      { accessorKey: 'lastSeen', header: 'Last Seen', cell: ({ row }) => new Date(row.original.lastSeen).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">User Analytics</h2>
            <div className="flex items-center space-x-4">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                <Button onClick={exportToPDF} variant="outline"><Download className="mr-2 h-4 w-4" />Export PDF</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader><CardTitle>Active Users</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{userAnalytics?.activeUsers}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>New Users</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{userAnalytics?.newUsers}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Retention Rate</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{userAnalytics?.retentionRate}%</p></CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>User Activity Trends</CardTitle>
                <CardDescription>Daily active users over the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userAnalytics?.activityTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" name="Active Users" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Top Users</CardTitle>
                <CardDescription>Users with the highest number of swaps.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={userAnalytics?.topUsers || []}
                    isLoading={isLoading}
                    filterColumn='name'
                    filterPlaceholder='Filter by name...'
                />
            </CardContent>
        </Card>

    </div>
  );
}
