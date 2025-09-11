import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '../../lib/api';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../../components/ui/badge';

interface AuditLog {
    id: string;
    user: { id: string; name: string; };
    action: string;
    timestamp: string;
    details: object;
}

export function AuditLogsPage() {
    const { data: logs, isLoading } = useQuery<AuditLog[]>({
        queryKey: ['auditLogs'],
        queryFn: () => settingsAPI.getAuditLogs().then(res => res.data),
    });

    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: 'timestamp',
            header: 'Timestamp',
            cell: ({ row }) => new Date(row.original.timestamp).toLocaleString(),
        },
        {
            accessorKey: 'user',
            header: 'User',
            cell: ({ row }) => row.original.user.name,
        },
        {
            accessorKey: 'action',
            header: 'Action',
            cell: ({ row }) => <Badge>{row.original.action}</Badge>,
        },
        {
            accessorKey: 'details',
            header: 'Details',
            cell: ({ row }) => <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(row.original.details, null, 2)}</pre>,
        },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Audit Logs</h2>
            <p className="text-gray-600">A record of important activities within the admin dashboard.</p>
            <DataTable
                columns={columns}
                data={logs || []}
                isLoading={isLoading}
                filterColumn="action"
                filterPlaceholder="Filter by action..."
            />
        </div>
    );
}
