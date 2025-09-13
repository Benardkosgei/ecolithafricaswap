import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: 'PAID' | 'PENDING';
}

export function BillingPage() {
    const { data: billingInfo, isLoading } = useQuery({
        queryKey: ['billingHistory'],
        queryFn: () => settingsAPI.getBillingHistory().then(res => res.data),
    });

    const invoiceColumns: ColumnDef<Invoice>[] = [
        { accessorKey: 'date', header: 'Date', cell: ({ row }) => new Date(row.original.date).toLocaleDateString() },
        { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `$${row.original.amount.toFixed(2)}` },
        { accessorKey: 'status', header: 'Status' },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Billing & Subscription</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription>You are currently on the <strong>{billingInfo?.plan.name}</strong> plan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-5xl font-bold">${billingInfo?.plan.price}<span className="text-lg font-normal">/month</span></p>
                            <p>Includes {billingInfo?.plan.stationsIncluded} stations and {billingInfo?.plan.swapsIncluded} swaps per month.</p>
                            <Button>Upgrade Plan</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Your primary payment method.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <img src={`/credit-cards/${billingInfo?.paymentMethod.cardType.toLowerCase()}.png`} alt={billingInfo?.paymentMethod.cardType} className="h-8 mr-4"/>
                            <div>
                                <p className="font-semibold">**** **** **** {billingInfo?.paymentMethod.last4}</p>
                                <p className="text-sm text-gray-500">Expires {billingInfo?.paymentMethod.expiryDate}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="mt-4">Update Payment Method</Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={invoiceColumns}
                        data={billingInfo?.invoices || []}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
