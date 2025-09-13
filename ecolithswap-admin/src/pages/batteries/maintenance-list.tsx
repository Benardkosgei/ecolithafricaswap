import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Search,
  Download,
  Wrench,
  CheckCircle,
  Battery as BatteryIcon,
} from 'lucide-react'
import { formatDate, getStatusColor } from '../../lib/utils'
import { batteriesAPI, Battery, PaginationResponse } from '../../lib/api'

const DEBOUNCE_DELAY = 300;

export function MaintenanceListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);


  const { data: batteryData, isLoading: batteriesLoading } = useQuery<PaginationResponse<Battery>>({
    queryKey: ['batteries', page, debouncedSearchTerm, 'maintenance'],
    queryFn: () => batteriesAPI.getBatteries({
        page,
        search: debouncedSearchTerm,
        status: 'maintenance',
      }).then(res => res.data),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Battery Maintenance</h2>
          <p className="text-gray-600 mt-2">
            Batteries requiring maintenance or service.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Batteries in Maintenance</p>
                <p className="text-2xl font-bold">{batteriesLoading ? '...' : batteryData?.pagination.total ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
                <BatteryIcon className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue Maintenance</p>
                    <p className="text-2xl font-bold text-red-600">{batteriesLoading ? '...' : '0'}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Batteries Table */}
          {batteriesLoading ? (
            <p>Loading batteries...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead>Cycles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batteryData?.data.map((battery) => (
                  <TableRow key={battery.id}>
                    <TableCell className="font-medium">
                      {battery.serialNumber}
                    </TableCell>
                    <TableCell>{battery.model}</TableCell>
                    <TableCell>
                      <span className={`font-medium`}>
                        {battery.healthStatus}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(battery.status)}>
                        {battery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(battery.lastMaintenanceDate)}</TableCell>
                    <TableCell>{battery.cycleCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                            <Wrench className="h-4 w-4 mr-2"/>
                            Service
                        </Button>
                        <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2"/>
                            Mark as Fixed
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {/* Pagination Controls */}
          <div className="flex justify-end items-center space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span>
              Page {page} of {batteryData?.pagination.totalPages ?? 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page === batteryData?.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
