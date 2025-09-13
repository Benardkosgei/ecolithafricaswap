import React from 'react';
import { useStation } from '../../hooks/useStations';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const defaultIcon = L.icon({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

interface StationDetailsProps {
  stationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StationDetails({ stationId, isOpen, onClose }: StationDetailsProps) {
  const { data: station, isLoading, error } = useStation(stationId);

  if (!isOpen) return null;

  const position: [number, number] = station ? [station.latitude, station.longitude] : [0, 0];

  const renderContent = () => {
    if (isLoading) return <div>Loading station details...</div>;
    if (error) return <div>Error loading station details.</div>;
    if (!station) return <div>Station not found.</div>;

    console.log(station);

    return (
      <div className="space-y-6 mt-4">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Station Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Operating Hours:</strong> {station.operatingHours}</p>
              <p><strong>Total Slots:</strong> {station.totalSlots}</p>
              <p><strong>Accepts Plastic:</strong> {station.acceptsPlastic ? 'Yes' : 'No'}</p>
              <p><strong>Self-Service:</strong> {station.selfService ? 'Yes' : 'No'}</p>
              {station.managerName && <p><strong>Manager:</strong> {station.managerName}</p>}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent style={{ height: '300px' }}>
              <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position} icon={defaultIcon}>
                  <Popup>{station.name}</Popup>
                </Marker>
              </MapContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Batteries at this Station</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Battery Code</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {station.batteries.length > 0 ? station.batteries.map((battery: any) => (
                  <TableRow key={battery.id}>
                    <TableCell>{battery.batteryCode}</TableCell>
                    <TableCell>{battery.serialNumber}</TableCell>
                    <TableCell><Badge>{battery.status}</Badge></TableCell>
                    <TableCell>{battery.currentChargePercentage}%</TableCell>
                    <TableCell>{battery.healthStatus}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No batteries currently at this station.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Rentals from this Station</CardTitle>
          </CardHeader>
          <CardContent>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Battery Code</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {station.recentRentals.length > 0 ? station.recentRentals.map((rental: any) => (
                  <TableRow key={rental.id}>
                    <TableCell>{rental.userName}</TableCell>
                    <TableCell>{rental.batteryCode}</TableCell>
                    <TableCell>{new Date(rental.startTime).toLocaleString()}</TableCell>
                    <TableCell><Badge>{rental.status}</Badge></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No recent rentals from this station.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          {isLoading ? (
            <DialogTitle>Loading...</DialogTitle>
          ) : station && (
            <>
              <DialogTitle className="text-2xl">{station.name}</DialogTitle>
              <DialogDescription>{station.address}</DialogDescription>
            </>
          )}
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
