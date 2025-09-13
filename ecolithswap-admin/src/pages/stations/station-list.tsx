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
  FileDown, 
  ListFilter, 
  Power, 
  Wrench 
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
import { useStations, useDeleteStation, useToggleMaintenance, useBulkUpdateStations, useStationStats } from '../../hooks/useStations';
import { StationForm } from './station-form';
import { StationDetails } from './station-details';
import toast from 'react-hot-toast';
import { Checkbox } from '../../components/ui/checkbox';
import { Station } from '../../types';

export function StationListPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);

  // Server-side state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: stationsResponse, isLoading, error } = useStations(pageIndex + 1, pageSize, { search: debouncedSearch });
  const { data: stats } = useStationStats();

  const deleteMutation = useDeleteStation();
  const toggleMaintenanceMutation = useToggleMaintenance();
  const bulkUpdateMutation = useBulkUpdateStations();

  const [rowSelection, setRowSelection] = useState({});

  const handleDelete = () => {
    if (!stationToDelete) return;
    toast.promise(
      deleteMutation.mutateAsync(stationToDelete),
      {
        loading: "Deleting station...",
        success: () => {
          setStationToDelete(null);
          setDialogOpen(false);
          return "Station deleted successfully!";
        },
        error: "Failed to delete station.",
      }
    );
  };

  const handleToggleMaintenance = (id: string, inMaintenance: boolean) => {
    toast.promise(
      toggleMaintenanceMutation.mutateAsync({ id, maintenance_mode: !inMaintenance }),
      {
        loading: "Updating maintenance mode...",
        success: "Maintenance mode updated!",
        error: "Failed to update maintenance mode.",
      }
    );
  };
  
  const columns: ColumnDef<Station>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
          <div 
            className="font-medium text-blue-600 hover:underline cursor-pointer"
            onClick={() => {
              setSelectedStation(row.original);
              setDetailsOpen(true);
            }}
          >
            {row.getValue("name")}
          </div>
        )
    },
    {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => <div className="truncate w-48">{row.getValue('address')}</div>,
    },
    {
        accessorKey: "availableBatteries",
        header: "Available",
    },
    {
        accessorKey: "inUseBatteries",
        header: "In Use",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const { status, in_maintenance } = row.original;
            if (in_maintenance) {
              return <Badge className="bg-yellow-500 text-white">Maintenance</Badge>;
            }
            let color = "";
            switch (status) {
                case "Active": color = "bg-green-500"; break;
                case "Inactive": color = "bg-gray-500"; break;
                default: color = "bg-gray-300";
            }
            return <Badge className={`${color} text-white`}>{status}</Badge>;
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const station = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                            setSelectedStation(station);
                            setFormOpen(true);
                        }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleMaintenance(station.id, station.in_maintenance)}>
                          <Wrench className="mr-2 h-4 w-4" />
                          {station.in_maintenance ? "Exit Maintenance" : "Enter Maintenance"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => {
                              setStationToDelete(station.id);
                              setDialogOpen(true);
                            }}
                          >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                          </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    }], [queryClient]);

  const table = useReactTable({
    data: stationsResponse?.data || [],
    columns,
    pageCount: stationsResponse?.totalPages ?? -1,
    state: {
      pagination: { pageIndex, pageSize },
      rowSelection,
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleBulkDisable = () => {
    if (selectedRows.length === 0) return;
    const stationIds = selectedRows.map(row => row.original.id);
    toast.promise(
      bulkUpdateMutation.mutateAsync({ station_ids: stationIds, update_data: { status: 'Inactive' } }),
      {
        loading: "Disabling stations...",
        success: "Stations disabled successfully!",
        error: "Failed to disable stations.",
      }
    );
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    const stationIds = selectedRows.map(row => row.original.id);
    toast.promise(
      Promise.all(stationIds.map(id => deleteMutation.mutateAsync(id))),
      {
        loading: "Deleting stations...",
        success: "Stations deleted successfully!",
        error: "Failed to delete stations.",
      }
    );
  };


  if (error) return <div className="text-red-500 p-4">Error loading stations: {error.message}</div>;
  
  return (
      <div className="space-y-4">
        <PageHeader title="Charging Stations Management" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">Total Stations: {stats?.total_stations ?? 'N/A'}</div>
            <div className="p-4 border rounded-lg">Active Stations: {stats?.active_stations ?? 'N/A'}</div>
            <div className="p-4 border rounded-lg">Under Maintenance: {stats?.maintenance_stations ?? 'N/A'}</div>
            <div className="p-4 border rounded-lg">Accepts Plastic: {stats?.plastic_accepting_stations ?? 'N/A'}</div>
        </div>

        <div className="flex justify-between items-center">
            <div className="flex-1">
                <Input 
                    placeholder="Search by name or address..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <ListFilter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {/* Filters options here */}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                </Button>
                <Button onClick={() => {
                    setSelectedStation(null);
                    setFormOpen(true);
                }} className="bg-green-600 hover:bg-green-700">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Station
                </Button>
            </div>
        </div>

        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
            <div className="text-sm font-medium">
              {selectedRows.length} of {table.getCoreRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleBulkDisable}>
                <Power className="mr-2 h-4 w-4" />
                Disable ({selectedRows.length})
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedRows.length})
              </Button>
            </div>
          </div>
        )}

        <DataTable table={table} columns={columns} isLoading={isLoading} />

        <StationForm 
          isOpen={isFormOpen} 
          onClose={() => setFormOpen(false)} 
          station={selectedStation}
        />
        
        {selectedStation && (
          <StationDetails
            stationId={selectedStation.id}
            isOpen={isDetailsOpen}
            onClose={() => setDetailsOpen(false)}
          />
        )}

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the station and all associated data.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setStationToDelete(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Yes, delete station
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
  );
}
