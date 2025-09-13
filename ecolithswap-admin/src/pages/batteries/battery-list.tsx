import React, { useState, useMemo } from 'react';
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
  Battery as BatteryIcon, 
  CheckCircle, 
  XCircle, 
  Clock 
} from 'lucide-react';
import { useDebounce } from '@uidotdev/usehooks';
import toast from 'react-hot-toast';

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
import { Card, CardContent } from '../../components/ui/card';
import { useBatteries, useDeleteBattery, useBatteryStats } from '../../hooks/useBatteries';
import { BatteryForm } from './battery-form';
import { Battery } from '../../types/battery';

export function BatteryListPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batteryToDelete, setBatteryToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: batteriesResponse, isLoading, error } = useBatteries(pageIndex + 1, pageSize, { search: debouncedSearch });
  const { data: stats } = useBatteryStats();
  const deleteMutation = useDeleteBattery();

  const handleDelete = () => {
    if (!batteryToDelete) return;
    toast.promise(deleteMutation.mutateAsync(batteryToDelete), {
      loading: 'Deleting battery...',
      success: () => {
        setBatteryToDelete(null);
        setDialogOpen(false);
        return 'Battery deleted successfully!';
      },
      error: 'Failed to delete battery.',
    });
  };

  const columns: ColumnDef<Battery>[] = useMemo(() => [
    { accessorKey: 'battery_code', header: 'Code' },
    { accessorKey: 'serial_number', header: 'Serial' },
    { accessorKey: 'model', header: 'Model' },
    {
      accessorKey: 'current_charge_percentage',
      header: 'Charge',
      cell: ({ row }) => `${row.original.current_charge_percentage}%`
    },
    {
      accessorKey: 'health_status',
      header: 'Health',
      cell: ({ row }) => <Badge>{row.original.health_status}</Badge>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={row.original.status === 'available' ? 'default' : 'secondary'}>{row.original.status}</Badge>
    },
    { accessorKey: 'cycle_count', header: 'Cycles' },
    { 
      accessorKey: 'current_station_id', 
      header: 'Station', 
      cell: ({row}) => row.original.station_name
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => { setSelectedBattery(row.original); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => { setBatteryToDelete(row.original.id); setDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ], []);

  const table = useReactTable({
    data: batteriesResponse?.batteries || [],
    columns,
    pageCount: batteriesResponse?.pagination.totalPages ?? -1,
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
  });

  if (error) return <div className="text-red-500 p-4">Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      <PageHeader title="Battery Management" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.map(stat => (
          <Card key={stat.name}><CardContent className="p-4 flex items-center"><BatteryIcon style={{color: stat.color}} className={`h-6 w-6 mr-4`}/><div className='flex flex-col'><p className='text-lg font-bold'>{stat.value}</p><p className='text-sm text-gray-500'>{stat.name}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Input
          placeholder="Search by code, serial, or model..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => { setSelectedBattery(null); setFormOpen(true); }} className="bg-green-600 hover:bg-green-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Battery
        </Button>
      </div>

      <DataTable table={table} columns={columns} isLoading={isLoading} />

      {isFormOpen && <BatteryForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} battery={selectedBattery} />}

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the battery.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatteryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Yes, delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
