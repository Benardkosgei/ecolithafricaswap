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
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Battery as BatteryIcon,
  MapPin,
} from 'lucide-react'
import { formatDate, getStatusColor, formatNumber } from '../../lib/utils'
import { batteriesAPI, Battery, BatteryStats, PaginationResponse } from '../../lib/api'

const DEBOUNCE_DELAY = 300;

export function BatteryListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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

  const { data: statsData, isLoading: statsLoading } = useQuery<BatteryStats>({
    queryKey: ['batteryStats'],
    queryFn: () => batteriesAPI.getBatteryStats().then(res => res.data),
  })

  const { data: batteryData, isLoading: batteriesLoading } = useQuery<PaginationResponse<Battery>>({
    queryKey: ['batteries', page, debouncedSearchTerm, statusFilter],
    queryFn: () => batteriesAPI.getBatteries({
        page,
        search: debouncedSearchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }).then(res => res.data),
  })

  const getChargeColor = (level: number) => {
    if (level >= 70) return 'text-green-600'
    if (level >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600'
    if (health >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Battery Management</h2>
          <p className="text-gray-600 mt-2">
            Monitor and manage your battery inventory
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Battery
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BatteryIcon className="h-8 w-8 text-[#2E7D32]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Batteries</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : formatNumber(statsData?.totalBatteries ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <BatteryIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{statsLoading ? '...' : formatNumber(statsData?.available ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BatteryIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Use</p>
                <p className="text-2xl font-bold text-blue-600">{statsLoading ? '...' : formatNumber(statsData?.rented ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <BatteryIcon className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Charging</p>
                <p className="text-2xl font-bold text-yellow-600">{statsLoading ? '...' : formatNumber(statsData?.charging ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Battery Inventory</CardTitle>
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">In Use</option>
              <option value="charging">Charging</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
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
                  <TableHead>Capacity</TableHead>
                  <TableHead>Charge Level</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
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
                    <TableCell>{battery.capacityKwh} kWh</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              battery.currentChargePercentage >= 70
                                ? 'bg-green-500'
                                : battery.currentChargePercentage >= 30
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${battery.currentChargePercentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getChargeColor(battery.currentChargePercentage)}`}>
                          {battery.currentChargePercentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getHealthColor(battery.healthStatus)}`}>
                        {battery.healthStatus}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(battery.status)}>
                        {battery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {battery.stationName && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {battery.stationName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(battery.lastMaintenanceDate)}</TableCell>
                    <TableCell>{battery.cycleCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
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
              disabled={page === (batteryData?.pagination.totalPages ?? 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
