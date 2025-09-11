import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Station } from '../../types'
import {
  MapPin,
  Battery,
  CheckCircle,
  XCircle,
  Settings,
  User,
  Clock,
  Edit,
  Info
} from 'lucide-react'

interface StationDetailsProps {
  station: Station;
  onClose: () => void;
  onEdit: () => void;
}

export function StationDetails({ station, onClose, onEdit }: StationDetailsProps) {
  const getStatusColor = () => {
    if (station.maintenance_mode) return 'bg-yellow-100 text-yellow-800'
    if (!station.is_active) return 'bg-red-100 text-red-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = () => {
    if (station.maintenance_mode) return 'Maintenance'
    if (!station.is_active) return 'Inactive'
    return 'Active'
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {station.image_url && (
              <img src={station.image_url} alt={station.name} className="h-10 w-10 rounded-full mr-4 object-cover" />
            )}
            {station.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2 text-gray-500" /> General Information
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>{station.address}</span>
                </p>
                <p className="flex items-center">
                  <strong className="font-medium mr-2">Type:</strong>
                  <Badge variant="outline" className="capitalize">{station.station_type}</Badge>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Settings className="h-4 w-4 mr-2 text-gray-500" /> Status & Capacity
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="flex items-center">
                  <strong className="font-medium mr-2">Status:</strong>
                  <Badge className={getStatusColor()}>{getStatusText()}</Badge>
                </p>
                <p className="flex items-center">
                  <Battery className="h-4 w-4 mr-2 text-gray-400" />
                  <strong className="font-medium mr-2">Battery Level:</strong>
                  <span>{station.available_batteries || 0} / {station.total_slots} available</span>
                </p>
                <p className="flex items-center">
                  <CheckCircle className={`h-4 w-4 mr-2 ${station.accepts_plastic ? 'text-green-500' : 'text-gray-400'}`} />
                  <strong className="font-medium mr-2">Accepts Plastic:</strong>
                  <span>{station.accepts_plastic ? 'Yes' : 'No'}</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
             <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" /> Management
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong className="font-medium">Manager:</strong> {station.manager_name || 'Not assigned'}
                </p>
                <p>
                  <strong className="font-medium">Contact:</strong> {station.manager_contact || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" /> Timestamps
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong className="font-medium">Last Updated:</strong> {new Date(station.updated_at).toLocaleString()}
                </p>
                <p>
                  <strong className="font-medium">Date Installed:</strong> {new Date(station.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {station.maintenance_mode && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center text-yellow-700">
                        <Settings className="h-4 w-4 mr-2" /> Maintenance Details
                    </h4>
                    <div className="text-sm bg-yellow-50 p-3 rounded-md border border-yellow-200">
                        <p><strong className="font-medium">Notes:</strong> {station.maintenance_notes || 'No notes provided.'}</p>
                    </div>
                </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </DialogClose>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Station
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
