import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table';
import { 
  ArrowUpDown, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  PlusCircle, 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus 
} from 'lucide-react';
import { useDebounce } from '@uidotdev/usehooks';

import { PageHeader } from '../../components/ui/page-header';
import { DataTable } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
} from '../../components/ui/alert-dialog';
import { useCustomers, useDeleteCustomer, useCustomerStats } from '../../hooks/useCustomers';
import { CustomerForm } from './customer-form';
import { Customer } from '../../lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/card';

export function CustomerListPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Server-side state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: usersResponse, isLoading, error } = useCustomers(pageIndex + 1, pageSize, { search: debouncedSearch });
  const { data: stats } = useCustomerStats();

  const deleteMutation = useDeleteCustomer();

  const handleDelete = () => {
    if (!customerToDelete) return;
    toast.promise(
      deleteMutation.mutateAsync(customerToDelete),
      {
        loading: 'Deleting customer...',
        success: () => {
          setCustomerToDelete(null);
          setDialogOpen(false);
          return 'Customer deleted successfully!';
        },
        error: 'Failed to delete customer.',
      }
    );
  };
  
  const inactiveUsers = useMemo(() => {
    if (stats?.totalUsers && stats?.activeUsers) {
      return stats.totalUsers - stats.activeUsers;
    } 
    return 'N/A';
  }, [stats]);

  const columns: ColumnDef<Customer>[] = useMemo(() => [
    {
      accessorKey: 'full_name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('full_name')}</div>
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge>{row.getValue('role')}</Badge>
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active');
        return <Badge variant={isActive ? 'default' : 'destructive'}>{isActive ? 'Active' : 'Inactive'}</Badge>;
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { setSelectedCustomer(customer); setFormOpen(true); }}>
                <Pencil className="mr-2 h-4 w-4" />Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => { setCustomerToDelete(customer.id); setDialogOpen(true); }}>
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    },
  ], []);

  const table = useReactTable({
    data: usersResponse?.data || [],
    columns,
    pageCount: usersResponse?.totalPages ?? -1,
    state: {
      pagination: { pageIndex, pageSize },
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
  });

  if (error) return <div className="text-red-500 p-4">Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      <PageHeader title="Customer Management" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center"><Users className="h-6 w-6 mr-4"/><div className='flex flex-col'><p className='text-lg font-bold'>{stats?.totalUsers ?? 'N/A'}</p><p className='text-sm text-gray-500'>Total Users</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center"><UserCheck className="h-6 w-6 mr-4"/><div className='flex flex-col'><p className='text-lg font-bold'>{stats?.activeUsers ?? 'N/A'}</p><p className='text-sm text-gray-500'>Active Users</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center"><UserPlus className="h-6 w-6 mr-4"/><div className='flex flex-col'><p className='text-lg font-bold'>{stats?.newUsersThisMonth ?? 'N/A'}</p><p className='text-sm text-gray-500'>New This Month</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center"><UserX className="h-6 w-6 mr-4"/><div className='flex flex-col'><p className='text-lg font-bold'>{inactiveUsers}</p><p className='text-sm text-gray-500'>Inactive Users</p></div></CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => { setSelectedCustomer(null); setFormOpen(true); }} className="bg-green-600 hover:bg-green-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <DataTable table={table} columns={columns} isLoading={isLoading} />

      {isFormOpen && (
        <CustomerForm
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          customer={selectedCustomer}
        />
      )}

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete()} className="bg-red-600 hover:bg-red-700">Yes, delete customer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
