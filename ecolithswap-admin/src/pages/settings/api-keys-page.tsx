import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../../lib/api';
import { DataTable } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { PlusCircle, Trash2, Copy } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { toast } from 'react-hot-toast';

interface ApiKey {
    id: string;
    name: string;
    lastUsed: string;
    createdAt: string;
    key: string; // This would be the prefix in a real app
}

export function ApiKeysPage() {
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = React.useState(false);
    const [keyName, setKeyName] = React.useState('');
    const [newKey, setNewKey] = React.useState<string | null>(null);

    const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
        queryKey: ['apiKeys'],
        queryFn: () => settingsAPI.getApiKeys().then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: () => settingsAPI.createApiKey(keyName),
        onSuccess: (data) => {
            toast.success('API Key created successfully!');
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            setNewKey(data.data.key);
            setCreateOpen(false);
        },
        onError: () => toast.error('Failed to create API key.'),
    });

    const revokeMutation = useMutation({
        mutationFn: (keyId: string) => settingsAPI.revokeApiKey(keyId),
        onSuccess: () => {
            toast.success('API Key revoked successfully!');
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
        },
        onError: () => toast.error('Failed to revoke API key.'),
    });

    const columns: ColumnDef<ApiKey>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'key', header: 'Key Prefix' },
        { 
            accessorKey: 'createdAt', 
            header: 'Created At', 
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() 
        },
        {
            accessorKey: 'lastUsed',
            header: 'Last Used',
            cell: ({ row }) => row.original.lastUsed ? new Date(row.original.lastUsed).toLocaleDateString() : 'Never'
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="destructive" size="sm" onClick={() => revokeMutation.mutate(row.original.id)}>
                    <Trash2 className="h-4 w-4" /> Revoke
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">API Keys</h2>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" />Generate Key</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate a new API key</DialogTitle>
                            <DialogDescription>Give your key a descriptive name for easy identification.</DialogDescription>
                        </DialogHeader>
                        <Input placeholder="e.g., 'My Production Server'" value={keyName} onChange={e => setKeyName(e.target.value)} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isLoading}>
                                {createMutation.isLoading ? 'Generating...' : 'Generate Key'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {newKey && (
                 <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>API Key Generated</DialogTitle>
                            <DialogDescription>Please copy your new API key. For security, we won't show it to you again.</DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-md">
                            <Input readOnly value={newKey} className="flex-1" />
                            <Button size="sm" onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copied!')}}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setNewKey(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <DataTable
                columns={columns}
                data={apiKeys || []}
                isLoading={isLoading}
                filterColumn="name"
                filterPlaceholder="Filter by name..."
            />
        </div>
    );
}
