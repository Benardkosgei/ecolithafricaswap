import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  MapPin,
  Battery,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  Edit,
  Settings,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { Station } from '../../types'
import { formatDate } from '../../lib/utils'
import { useNearbyStations } from '../../hooks/useStations'
import { useBatteries } from '../../hooks/useBatteries'
import { useRentals } from '../../hooks/useRentals'

interface StationDetailsProps {
  station: Station
  onClose: () => void
  onEdit: () => void
}

export function StationDetails({ station, onClose, onEdit }: StationDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch related data
  const { data: batteriesResponse } = useBatteries({
    station_id: station.id,
    limit: 50
  })
  
  const { data: rentalsResponse } = useRentals({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  const { data: nearbyStations } = useNearbyStations(
    station.latitude,
    station.longitude,
    5000 // 5km radius
  )

  const batteries = batteriesResponse?.data || []
  const recentRentals = rentalsResponse?.data?.filter(rental => 
    rental.pickup_station_id === station.id || rental.return_station_id === station.id
  ).slice(0, 5) || []

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

  const getBatteryStatusCounts = () => {
    const statusCounts = {
      available: 0,
      rented: 0,
      charging: 0,
      maintenance: 0
    }
    
    batteries.forEach(battery => {
      if (statusCounts.hasOwnProperty(battery.status)) {
        statusCounts[battery.status as keyof typeof statusCounts]++
      }
    })
    
    return statusCounts
  }

  const getBatteryHealthCounts = () => {
    const healthCounts = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      critical: 0
    }
    
    batteries.forEach(battery => {
      if (healthCounts.hasOwnProperty(battery.health_status)) {
        healthCounts[battery.health_status as keyof typeof healthCounts]++
      }
    })
    
    return healthCounts
  }

  const statusCounts = getBatteryStatusCounts()
  const healthCounts = getBatteryHealthCounts()

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{station.name}</DialogTitle>
              <DialogDescription className="flex items-center mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                {station.address}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(station)}>
                {getStatusText(station)}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {station.station_type}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="batteries">Batteries</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Station Image */}
            {station.image_url && (
              <Card>
                <CardContent className="p-0">
                  <img
                    src={station.image_url}
                    alt={station.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Battery className="h-8 w-8 text-[#2E8B57] mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-xl font-bold">{statusCounts.available}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Zap className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Charging</p>
                      <p className="text-xl font-bold">{statusCounts.charging}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Rented</p>
                      <p className="text-xl font-bold">{statusCounts.rented}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Settings className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Maintenance</p>
                      <p className="text-xl font-bold">{statusCounts.maintenance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Station Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Station Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {station.station_type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Slots:</span>
                    <span className="font-medium">{station.total_slots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-medium text-green-600">{station.available_batteries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operating Hours:</span>
                    <span className="font-medium">{station.operating_hours || '24/7'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Self Service:</span>
                    {station.self_service ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accepts Plastic:</span>
                    {station.accepts_plastic ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact & Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manager:</span>
                    <span className="font-medium">{station.manager_name || 'Not assigned'}</span>
                  </div>
                  {station.manager_email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-blue-600">{station.manager_email}</span>
                    </div>
                  )}
                  {station.manager_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{station.manager_phone}</span>
                    </div>
                  )}
                  {station.contact_info && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Support:</span>
                      <span className="font-medium">{station.contact_info}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatDate(station.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{formatDate(station.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="batteries" className="space-y-4">
            {/* Battery Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Battery Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{healthCounts.excellent}</div>
                    <div className="text-sm text-gray-600">Excellent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{healthCounts.good}</div>
                    <div className="text-sm text-gray-600">Good</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{healthCounts.fair}</div>
                    <div className="text-sm text-gray-600">Fair</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{healthCounts.poor}</div>
                    <div className="text-sm text-gray-600">Poor</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{healthCounts.critical}</div>
                    <div className="text-sm text-gray-600">Critical</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Battery List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Batteries at this Station</CardTitle>
              </CardHeader>
              <CardContent>
                {batteries.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {batteries.map((battery) => (
                      <div key={battery.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Battery className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{battery.battery_code}</div>
                            <div className="text-sm text-gray-600">{battery.model}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sm font-medium">{battery.current_charge_percentage}% Charge</div>
                            <div className="text-sm text-gray-600">{battery.cycle_count} Cycles</div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${
                              battery.status === 'available' ? 'text-green-600 border-green-600' :
                              battery.status === 'rented' ? 'text-orange-600 border-orange-600' :
                              battery.status === 'charging' ? 'text-blue-600 border-blue-600' :
                              'text-gray-600 border-gray-600'
                            }`}
                          >
                            {battery.status}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`${
                              battery.health_status === 'excellent' ? 'text-green-600 border-green-600' :
                              battery.health_status === 'good' ? 'text-blue-600 border-blue-600' :
                              battery.health_status === 'fair' ? 'text-yellow-600 border-yellow-600' :
                              battery.health_status === 'poor' ? 'text-orange-600 border-orange-600' :
                              'text-red-600 border-red-600'
                            }`}
                          >
                            {battery.health_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Battery className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No batteries assigned to this station</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {/* Recent Rentals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRentals.length > 0 ? (
                  <div className="space-y-3">
                    {recentRentals.map((rental) => (
                      <div key={rental.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            rental.status === 'active' ? 'bg-green-500' :
                            rental.status === 'completed' ? 'bg-blue-500' :
                            rental.status === 'cancelled' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          <div>
                            <div className="font-medium">{rental.user_name}</div>
                            <div className="text-sm text-gray-600">
                              {rental.pickup_station_id === station.id ? 'Picked up' : 'Returned'} 
                              {rental.battery_code ? ` • ${rental.battery_code}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium capitalize">{rental.status}</div>
                          <div className="text-sm text-gray-600">{formatDate(rental.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            {/* Coordinates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Latitude</label>
                    <div className="text-lg font-mono">{station.latitude}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Longitude</label>
                    <div className="text-lg font-mono">{station.longitude}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">Full Address</label>
                  <div className="text-lg">{station.address}</div>
                </div>
              </CardContent>
            </Card>

            {/* Nearby Stations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nearby Stations</CardTitle>
              </CardHeader>
              <CardContent>
                {nearbyStations && nearbyStations.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {nearbyStations
                      .filter(nearby => nearby.id !== station.id)
                      .slice(0, 5)
                      .map((nearby) => (
                      <div key={nearby.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{nearby.name}</div>
                          <div className="text-sm text-gray-600">{nearby.address}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{nearby.distance?.toFixed(1)} km</div>
                          <Badge variant="outline" className="capitalize">
                            {nearby.station_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No nearby stations found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit} className="bg-[#8BC34A] hover:bg-[#7CB342] text-white">
            <Edit className="h-4 w-4 mr-2" />
            Edit Station
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}