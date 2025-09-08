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
  Battery,
  MapPin,
} from 'lucide-react'
import { formatDate, getStatusColor } from '../../lib/utils'

interface BatteryData {
  id: string
  serialNumber: string
  model: string
  capacityMah: number
  chargeLevel: number
  healthPercentage: number
  status: string
  stationName?: string
  lastService: string
  totalCycles: number
}

// Mock data - would come from API
const mockBatteries: BatteryData[] = [
  {
    id: '1',
    serialNumber: 'BAT-2024-001',
    model: 'EcoLith Pro 5000',
    capacityMah: 5000,
    chargeLevel: 85,
    healthPercentage: 98,
    status: 'available',
    stationName: 'Downtown Mall',
    lastService: '2025-01-15T10:30:00Z',
    totalCycles: 245,
  },
  {
    id: '2',
    serialNumber: 'BAT-2024-002',
    model: 'EcoLith Pro 5000',
    capacityMah: 5000,
    chargeLevel: 15,
    healthPercentage: 92,
    status: 'charging',
    stationName: 'Central Park',
    lastService: '2025-01-10T14:20:00Z',
    totalCycles: 387,
  },
  {
    id: '3',
    serialNumber: 'BAT-2024-003',
    model: 'EcoLith Standard 3000',
    capacityMah: 3000,
    chargeLevel: 0,
    healthPercentage: 75,
    status: 'maintenance',
    lastService: '2024-12-28T09:15:00Z',
    totalCycles: 892,
  },
  {
    id: '4',
    serialNumber: 'BAT-2024-004',
    model: 'EcoLith Pro 5000',
    capacityMah: 5000,
    chargeLevel: 95,
    healthPercentage: 89,
    status: 'in-use',
    lastService: '2025-01-20T11:45:00Z',
    totalCycles: 456,
  },
]

export function BatteryListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredBatteries = mockBatteries.filter((battery) => {
    const matchesSearch = battery.serialNumber
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || battery.status === statusFilter
    return matchesSearch && matchesStatus
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
              <Battery className="h-8 w-8 text-[#2E7D32]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Batteries</p>
                <p className="text-2xl font-bold">8,924</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Battery className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">4,234</p>
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
                <p className="text-sm font-medium text-gray-600">In Use</p>
                <p className="text-2xl font-bold text-blue-600">2,890</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Battery className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Charging</p>
                <p className="text-2xl font-bold text-yellow-600">1,256</p>
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
              <option value="in-use">In Use</option>
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
              {filteredBatteries.map((battery) => (
                <TableRow key={battery.id}>
                  <TableCell className="font-medium">
                    {battery.serialNumber}
                  </TableCell>
                  <TableCell>{battery.model}</TableCell>
                  <TableCell>{battery.capacityMah} mAh</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            battery.chargeLevel >= 70
                              ? 'bg-green-500'
                              : battery.chargeLevel >= 30
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${battery.chargeLevel}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getChargeColor(battery.chargeLevel)}`}>
                        {battery.chargeLevel}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${getHealthColor(battery.healthPercentage)}`}>
                      {battery.healthPercentage}%
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
                  <TableCell>{formatDate(battery.lastService)}</TableCell>
                  <TableCell>{battery.totalCycles}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
