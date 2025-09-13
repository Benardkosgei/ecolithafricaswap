
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from '../../components/ui/heatmap-layer';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

export function GeographicAnalysisPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { data, isLoading, error } = useQuery([
    'geographicAnalysis',
    dateRange?.from?.toISOString(),
    dateRange?.to?.toISOString(),
  ], () => {
    if (!dateRange?.from || !dateRange?.to) return Promise.resolve(null);
    return analyticsAPI.getGeographicAnalysis(
      dateRange.from.toISOString(),
      dateRange.to.toISOString()
    ).then(res => res.data);
  });

  const position: [number, number] = [51.505, -0.09];

  if (isLoading) return <div>Loading geographic data...</div>;
  if (error instanceof Error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Geographic Analysis</h2>
          <p className="text-gray-500">Visualize station activity and user density.</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Station Activity Heatmap</CardTitle>
          <CardDescription>Hotspots indicate high battery swap activity.</CardDescription>
        </CardHeader>
        <CardContent style={{ height: '600px' }}>
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {data?.heatmapData && (
              <HeatmapLayer points={data.heatmapData} />
            )}
            {data?.stationMarkers.map((station: any) => (
              <Marker key={station.id} position={[station.lat, station.lng]}>
                <Popup>
                  <b>{station.name}</b><br/>
                  Swaps: {station.swapCount}<br/>
                  Status: {station.status}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}