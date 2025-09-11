
import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
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
} from "lucide-react";

import { PageHeader } from "../../components/ui/page-header";
import { DataTable } from "../../components/ui/data-table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Badge } from "../../components/ui/badge";
import { AlertDialog, AlertDialogTrigger } from "../../components/ui/alert-dialog";
import { useStations, useDeleteStation, useToggleMaintenance, useBulkUpdateStations, useStationStats } from "../../hooks/useStations";
import { StationForm } from "./station-form.tsx";
import { StationDetails } from "./station-details.tsx";
import toast from "react-hot-toast";
import { Checkbox } from "../../components/ui/checkbox";

export function StationListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const { data: stations, isLoading, error } = useStations(search);
  const { data: stats } = useStationStats();

  const deleteMutation = useDeleteStation();
  const toggleMaintenanceMutation = useToggleMaintenance();
  const bulkUpdateMutation = useBulkUpdateStations();

  const [rowSelection, setRowSelection] = useState({});

  const handleDelete = (id) => {
    toast.promise(
      deleteMutation.mutateAsync(id).then(() => {
        queryClient.invalidateQueries("stations");
      }),
      {
        loading: "Deleting station...",
        success: "Station deleted successfully!",
        error: "Failed to delete station.",
      }
    );
  };

  const handleToggleMaintenance = (id, inMaintenance) => {
    toast.promise(
      toggleMaintenanceMutation.mutateAsync({ id, inMaintenance }).then(() => {
        queryClient.invalidateQueries("stations");
      }),
      {
        loading: "Updating maintenance mode...",
        success: "Maintenance mode updated!",
        error: "Failed to update maintenance mode.",
      }
    );
  };
  
  const columns = useMemo(() => [
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
              setSelectedStation(row.original.id);
              setDetailsOpen(true);
            }}
          >
            {row.getValue("name")}
          </div>
        )
    },
    {
        accessorKey: "location",
        header: "Location",
    },
    {
        accessorKey: "availableBatteries",
        header: "Available Batteries",
    },
    {
        accessorKey: "inUseBatteries",
        header: "In Use",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status");
            let color = "";
            switch (status) {
                case "Active": color = "bg-green-500"; break;
                case "Inactive": color = "bg-gray-500"; break;
                case "Maintenance": color = "bg-yellow-500"; break;
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
                        <DropdownMenuItem onClick={() => handleToggleMaintenance(station.id, station.status !== "Maintenance")}>
                          <Wrench className="mr-2 h-4 w-4" />
                          {station.status === "Maintenance" ? "Disable Maintenance" : "Enable Maintenance"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    }\], [queryClient]);

  const table = useReactTable({
    data: stations || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter: search,
      rowSelection,
    },
    onGlobalFilterChange: setSearch,
    onRowSelectionChange: setRowSelection,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleBulkDisable = () => {
    if (selectedRows.length === 0) return;
    const stationIds = selectedRows.map(row => row.original.id);
    toast.promise(
      bulkUpdateMutation.mutateAsync({ station_ids: stationIds, update_data: { is_active: false } }).then(() => {
        queryClient.invalidateQueries("stations");
        setRowSelection({});
      }),
      {
        loading: "Disabling stations...",
        success: "Stations disabled successfully!",
        error: "Failed to disable stations.",
      }
    );
  };


  if (error) return <div className="text-red-500">Error loading stations. Please try again.</div>;
  
  return (
      <div className="space-y-4">
        <PageHeader title="Charging Stations" />

        <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">Total Stations: {stats?.totalStations}</div>
            <div className="p-4 border rounded-lg">Active Stations: {stats?.activeStations}</div>
            <div className="p-4 border rounded-lg">Avg. Battery Level: {stats?.avgBatteryLevel?.toFixed(2)}%</div>
            <div className="p-4 border rounded-lg">Avg. Availability: {stats?.avgAvailability?.toFixed(2)}%</div>
        </div>

        <div className="flex justify-between items-center">
            <div className="flex-1">
                <Input 
                    placeholder="Search stations..."
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
                }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Station
                </Button>
            </div>
        </div>

        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
            <div className="text-sm font-medium">
              {selectedRows.length} of {table.getCoreRowModel().rows.length} row(s) selected.
            </div>
            <div>
              <Button variant="outline" size="sm" className="mr-2" onClick={handleBulkDisable}>
                <Power className="mr-2 h-4 w-4" />
                Disable
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataTable table={table} columns={columns} />
        )}

        <StationForm 
          isOpen={isFormOpen} 
          onClose={() => setFormOpen(false)} 
          station={selectedStation}
        />
        
        {selectedStation && (
          <StationDetails
            stationId={selectedStation}
            isOpen={isDetailsOpen}
            onClose={() => setDetailsOpen(false)}
          />
        )}
      </div>
  );
}
