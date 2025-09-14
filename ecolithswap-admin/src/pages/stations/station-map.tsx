import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useStations } from '../../hooks/useStations';
import { PageHeader } from '../../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icon issue with Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const statusColors = {
  active: '#22c55e', // green-500
  inactive: '#ef4444', // red-500
  maintenance: '#f97316', // orange-500
};

function StationMarker({ station }) {
  const icon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="${statusColors[station.status]}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><circle cx="12" cy="9.5" r="1.5" fill="white"/></svg>`,
    className: 'bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <Marker position={[station.latitude, station.longitude]} icon={icon}>
      <Popup>
        <div className="font-bold">{station.name}</div>
        <div>{station.address}</div>
        <div className="capitalize">Status: <span style={{ color: statusColors[station.status] }}>{station.status}</span></div>
        <div>Batteries: {station.available_batteries}/{station.capacity}</div>
      </Popup>
    </Marker>
  );
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export function StationMapPage() {
  const { data: stationsResponse, isLoading, error } = useStations(1, 100); // Fetch up to 100 stations
  const [selectedStation, setSelectedStation] = useState(null);
  const [view, setView] = useState({ center: [51.505, -0.09], zoom: 10 });

  const handleStationSelect = (stationId) => {
    const station = stationsResponse?.stations.find(s => s.id === stationId);
    if (station) {
      setSelectedStation(station);
      setView({ center: [station.latitude, station.longitude], zoom: 15 });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Stations Map" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
        <div className="lg:col-span-1 flex flex-col space-y-4">
          <Card>
            <CardHeader><CardTitle>Station Locator</CardTitle></CardHeader>
            <CardContent>
              <Select onValueChange={handleStationSelect}>
                <SelectTrigger><SelectValue placeholder="Select a station..." /></SelectTrigger>
                <SelectContent>
                  {stationsResponse?.stations.map(station => (
                    <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          {selectedStation && (
            <Card>
              <CardHeader><CardTitle>{selectedStation.name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p>{selectedStation.address}</p>
                <p><strong>Status:</strong> <span className="capitalize" style={{ color: statusColors[selectedStation.status]}}>{selectedStation.status}</span></p>
                <p><strong>Capacity:</strong> {selectedStation.available_batteries} / {selectedStation.capacity}</p>
                <p><strong>GPS:</strong> {selectedStation.latitude.toFixed(4)}, {selectedStation.longitude.toFixed(4)}</p>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="lg:col-span-2 h-[600px] lg:h-auto">
          <MapContainer center={view.center} zoom={view.zoom} className="w-full h-full rounded-lg shadow-md">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {stationsResponse?.stations.map(station => (
              <StationMarker key={station.id} station={station} />
            ))}
            {selectedStation && <ChangeView center={view.center} zoom={view.zoom} />}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
