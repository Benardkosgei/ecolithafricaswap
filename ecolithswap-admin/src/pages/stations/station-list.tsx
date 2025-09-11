import React, { useState } from 'react'
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
  MapPin,
  Battery,
  Eye,
  AlertTriangle,
  Settings,
  CheckCircle,
  XCircle,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog'
import { formatDate } from '../../lib/utils'
import { useStations, useDeleteStation, useToggleMaintenance, useBulkUpdateStations, useStationStats } from '../../hooks/useStations'
import { Station } from '../../types'
import { StationForm } from './station-form'
import { StationDetails } from './station-details'
import toast from 'react-hot-toast'
import { Checkbox } from '../../components/ui/checkbox'

export function StationListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [stationTypeFilter, setStationTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [acceptsPlasticFilter, setAcceptsPlasticFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [selectedStations, setSelectedStations] = useState<string[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [viewingStation, setViewingStation] = useState<Station | null>(null)
  const [maintenanceStation, setMaintenanceStation] = useState<Station | null>(null)
  const [maintenanceNotes, setMaintenanceNotes] = useState('')

  // API Hooks
  const {
    data: stationsResponse,
    isLoading,
    error
  } = useStations({
    page,
    limit,
    search: searchTerm || undefined,
    station_type: stationTypeFilter !== 'all' ? stationTypeFilter : undefined,
    is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    accepts_plastic: acceptsPlasticFilter === 'yes' ? true : acceptsPlasticFilter === 'no' ? false : undefined,
  })

  const { data: stationStats } = useStationStats()
  const deleteStationMutation = useDeleteStation()
  const toggleMaintenanceMutation = useToggleMaintenance()
  const bulkUpdateMutation = useBulkUpdateStations()

  const stations = stationsResponse?.data || []
  const pagination = stationsResponse?.pagination

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStations(stations.map(station => station.id))
    } else {
      setSelectedStations([])
    }
  }

  const handleSelectStation = (stationId: string, checked: boolean) => {
    if (checked) {
      setSelectedStations(prev => [...prev, stationId])
    } else {
      setSelectedStations(prev => prev.filter(id => id !== stationId))
    }
  }

  const handleDeleteStation = async (stationId: string) => {
    try {
      await deleteStationMutation.mutateAsync(stationId)
      setSelectedStations(prev => prev.filter(id => id !== stationId))
    } catch (error) {
      console.error('Error deleting station:', error)
    }
  }

  const handleToggleMaintenance = async (station: Station) => {
    try {
      await toggleMaintenanceMutation.mutateAsync({
        id: station.id,
        maintenance_mode: !station.maintenance_mode,
        notes: maintenanceNotes || undefined
      })
      setMaintenanceStation(null)
      setMaintenanceNotes('')
    } catch (error) {
      console.error('Error toggling maintenance:', error)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedStations.length === 0) {
      toast.error('Please select stations first')
      return
    }

    try {
      let updateData = {}
      switch (action) {
        case 'activate':
          updateData = { is_active: true }
          break
        case 'deactivate':
          updateData = { is_active: false }
          break
        case 'maintenance':
          updateData = { maintenance_mode: true }
          break
        case 'end_maintenance':
          updateData = { maintenance_mode: false }
          break
        default:
          return
      }

      await bulkUpdateMutation.mutateAsync({
        station_ids: selectedStations,
        update_data: updateData
      })
      setSelectedStations([])
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const getStatusColor = (station: Station) => {
    if (station.maintenance_mode) return 'bg-yellow-100 text-yellow-800'
    if (!station.is_active) return 'bg-red-100 text-red-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (station: Station) => {
    if (station.maintenance_mode) return 'Maintenance'
    if (!station.is_active) return 'Inactive'
    return 'Active'
  }

  const getBatteryLevelColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage >= 70) return 'text-green-600'
    if (percentage >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Stations</h3>
          <p className="text-gray-600">There was an error loading the station data. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Station Management</h2>
          <p className="text-gray-600 mt-2">
            Monitor and manage your battery swap stations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <MapPin className="h-4 w-4 mr-2" />
            Map View
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="bg-[#8BC34A] hover:bg-[#7CB342] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Station
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-[#2E8B57]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Stations</p>
                <p className="text-2xl font-bold">{stationStats?.totalStations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stationStats?.activeStations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Settings className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{stationStats?.maintenanceStations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Battery className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Plastic Accepting</p>
                <p className_="text-2xl font-bold text-blue-600">{stationStats?.plasticAcceptingStations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Station Inventory</CardTitle>
            {selectedStations.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{selectedStations.length} selected</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      Activate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      Deactivate Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('maintenance')}>
                      Set to Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('end_maintenance')}>
                      End Maintenance
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stationTypeFilter} onValueChange={setStationTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="swap">Swap</SelectItem>
                <SelectItem value="charge">Charge</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={acceptsPlasticFilter} onValueChange={setAcceptsPlasticFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plastic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Accepts Plastic</SelectItem>
                <SelectItem value="no">No Plastic</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Stations Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E8B57]"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStations.length === stations.length && stations.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Station Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Battery Level</TableHead>
                    <TableHead>Plastic</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStations.includes(station.id)}
                          onCheckedChange={(checked) => handleSelectStation(station.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {station.image_url && (
                            <img
                              src={station.image_url}
                              alt={station.name}
                              className="h-8 w-8 rounded object-cover mr-3"
                            />
                          )}
                          {station.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate">
                        {station.address}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {station.station_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(station)}>
                          {getStatusText(station)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Battery className="h-4 w-4 mr-2 text-gray-400" />
                          <span className={`font-medium ${getBatteryLevelColor(station.available_batteries || 0, station.total_slots)}`}>
                            {station.available_batteries || 0}/{station.total_slots}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {station.accepts_plastic ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {station.manager_name || 'Not assigned'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(station.updated_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setViewingStation(station)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingStation(station)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Station
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setMaintenanceStation(station)}>
                              <Settings className="h-4 w-4 mr-2" />
                              {station.maintenance_mode ? 'End Maintenance' : 'Start Maintenance'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Station
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the station
                                    "{station.name}" and remove all associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteStation(station.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Station
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} stations
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showCreateForm && (
        <StationForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            // Refresh stations list
          }}
        />
      )}

      {editingStation && (
        <StationForm
          station={editingStation}
          onClose={() => setEditingStation(null)}
          onSuccess={() => {
            setEditingStation(null)
            // Refresh stations list
          }}
        />
      )}

      {viewingStation && (
        <StationDetails
          station={viewingStation}
          onClose={() => setViewingStation(null)}
          onEdit={() => {
            setEditingStation(viewingStation)
            setViewingStation(null)
          }}
        />
      )}

      {/* Maintenance Modal */}
      {maintenanceStation && (
        <AlertDialog open={!!maintenanceStation} onOpenChange={() => setMaintenanceStation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {maintenanceStation.maintenance_mode ? 'End Maintenance Mode' : 'Start Maintenance Mode'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {maintenanceStation.maintenance_mode
                  ? `Are you sure you want to end maintenance mode for "${maintenanceStation.name}"? The station will become available for battery swaps.`
                  : `Are you sure you want to put "${maintenanceStation.name}" into maintenance mode? The station will be temporarily unavailable for battery swaps.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            {!maintenanceStation.maintenance_mode && (
              <div className="my-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Maintenance Notes (Optional)
                </label>
                <textarea
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  placeholder="Enter maintenance notes or reason..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleToggleMaintenance(maintenanceStation)}
                className={maintenanceStation.maintenance_mode ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
              >
                {maintenanceStation.maintenance_mode ? 'End Maintenance' : 'Start Maintenance'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
