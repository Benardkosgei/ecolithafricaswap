
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  FileDown, 
  ListFilter
} from "lucide-react";

import { PageHeader } from "../../components/ui/page-header";
import { DataTable } from "../../components/ui/data-table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "../../components/ui/dropdown-menu";
import { Badge } from "../../components/ui/badge";
import { useRentals } from "../../hooks/useRentals";
import { Rental } from "../../lib/api";

export function RentalListPage() {
  const [search, setSearch] = useState("");

  const { data: rentals, isLoading, error } = useRentals(1, 10, { search });
  
  const columns: ColumnDef<Rental>[] = useMemo(() => [
    {
        accessorKey: "userName",
        header: "User",
    },
    {
        accessorKey: "batteryCode",
        header: "Battery Code",
    },
    {
        accessorKey: "startTime",
        header: "Start Time",
        cell: ({ row }) => new Date(row.getValue("startTime")).toLocaleString(),
    },
    {
        accessorKey: "endTime",
        header: "End Time",
        cell: ({ row }) => row.getValue("endTime") ? new Date(row.getValue("endTime")).toLocaleString() : "-",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status");
            let color = "";
            switch (status) {
                case "Active": color = "bg-green-500"; break;
                case "Completed": color = "bg-blue-500"; break;
                case "Overdue": color = "bg-red-500"; break;
                default: color = "bg-gray-300";
            }
            return <Badge className={`${color} text-white`}>{status}</Badge>;
        }
    },
  ], []);

  const table = useReactTable({
    data: rentals?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter: search,
    },
    onGlobalFilterChange: setSearch,
  });

  if (error) return <div className="text-red-500">Error loading rentals. Please try again.</div>;
  
  return (
      <div className="space-y-4">
        <PageHeader title="Rentals" />

        <div className="flex justify-between items-center">
            <div className="flex-1">
                <Input 
                    placeholder="Search rentals..."
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
            </div>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DataTable table={table} columns={columns} />
        )}

      </div>
  );
}
