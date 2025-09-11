import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../../lib/api';
import { DataTable } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'react-hot-toast';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'VIEWER';
    lastLogin: string;
}

export function UserManagementPage() {
    const queryClient = useQueryClient();
    const [inviteOpen, setInviteOpen] = React.useState(false);
    const [newUser, setNewUser] = React.useState({ email: '', role: 'VIEWER' });

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: () => settingsAPI.getUsers().then(res => res.data),
    });

    const inviteMutation = useMutation({
        mutationFn: () => settingsAPI.inviteUser(newUser.email, newUser.role as any),
        onSuccess: () => {
            toast.success('User invited successfully!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setInviteOpen(false);
        },
        onError: () => toast.error('Failed to invite user.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => settingsAPI.deleteUser(userId),
        onSuccess: () => {
            toast.success('User deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => toast.error('Failed to delete user.'),
    });

    const columns: ColumnDef<User>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
        },
        {
            accessorKey: 'lastLogin',
            header: 'Last Login',
            cell: ({ row }) => new Date(row.original.lastLogin).toLocaleString(),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(row.original.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">User Management</h2>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" />Invite User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite a new user</DialogTitle>
                            <DialogDescription>Enter the email and select a role to send an invitation.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input 
                                placeholder="user@example.com" 
                                value={newUser.email} 
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })} 
                            />
                            <Select onValueChange={role => setNewUser({ ...newUser, role })} value={newUser.role}>
                                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                            <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isLoading}>
                                {inviteMutation.isLoading ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={columns}
                data={users || []}
                isLoading={isLoading}
                filterColumn="name"
                filterPlaceholder="Filter by name..."
            />
        </div>
    );
}
