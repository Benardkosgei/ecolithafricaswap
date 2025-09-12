
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

// Mock data for batteries, as we don't have an endpoint yet.
const mockBatteries = [
  { id: 'BATT001', status: 'Charged', health: '98%', cycles: 150 },
  { id: 'BATT002', status: 'In Use', health: '95%', cycles: 200 },
  { id: 'BATT003', status: 'Charging', health: '99%', cycles: 120 },
  { id: 'BATT004', status: 'Maintenance', health: '80%', cycles: 500 },
];

export function StationDetails() {
  const { stationId } = useParams<{ stationId: string }>();

  // Placeholder for fetching station data.
  // Replace with a real API call.
  const { data: station, isLoading, error } = useQuery({
    queryKey: ['stationDetails', stationId],
    queryFn: () => {
        // Mocking the API call
        return Promise.resolve({
            id: stationId,
            name: `Station ${stationId}`,
            location: '123 Main St, Anytown, USA',
            status: 'Active',
            capacity: 20,
            availableBatteries: 15,
            lat: 51.505,
            lng: -0.09,
            swapCount: 123,
        });
    },
    enabled: !!stationId,
  });

  if (isLoading) return <div>Loading station details...</div>;
  if (error) return <div>Error loading station details.</div>;
  if (!station) return <div>Station not found.</div>;

  const position: [number, number] = [station.lat, station.lng];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{station.name}</h2>
          <p className="text-gray-500">{station.location}</p>
        </div>
        <Badge variant={station.status === 'Active' ? 'default' : 'destructive'}>{station.status}</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Station Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>ID:</strong> {station.id}</p>
            <p><strong>Capacity:</strong> {station.capacity} batteries</p>
            <p><strong>Available:</strong> {station.availableBatteries} batteries</p>
            <p><strong>Total Swaps:</strong> {station.swapCount}</p>
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
              <Marker position={position}>
                <Popup>{station.name}</Popup>
              </Marker>
            </MapContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batteries at this Station</CardTitle>
          <CardDescription>Real-time status of all batteries.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Battery ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Charge Cycles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBatteries.map((battery) => (
                <TableRow key={battery.id}>
                  <TableCell>{battery.id}</TableCell>
                  <TableCell><Badge>{battery.status}</Badge></TableCell>
                  <TableCell>{battery.health}</TableCell>
                  <TableCell>{battery.cycles}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
