import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from 'react-leaflet-heatmap-layer-v3';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';

export function GeographicAnalysisPage() {
  const [dateRange, setDateRange] = useState({ from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), to: new Date() });

  const { data: geoData, isLoading } = useQuery({
    queryKey: ['geoAnalytics', dateRange],
    queryFn: () => analyticsAPI.getGeoAnalytics(dateRange.from, dateRange.to).then(res => res.data),
  });

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Geographic Analysis</h2>
            <div className="flex items-center space-x-4">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export PDF</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Swap Heatmap</CardTitle>
                <CardDescription>Visualization of swap activity across different locations.</CardDescription>
            </CardHeader>
            <CardContent style={{ height: '500px' }}>
                <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {geoData && (
                        <HeatmapLayer
                            points={geoData.heatmapPoints}
                            longitudeExtractor={m => m[1]}
                            latitudeExtractor={m => m[0]}
                            intensityExtractor={m => m[2]}
                            radius={20}
                            blur={15}
                        />
                    )}
                     {geoData?.stationPerformance.map(station => (
                        <Marker key={station.id} position={[station.lat, station.lng]}>
                            <Popup>
                                <b>{station.name}</b><br />
                                Swaps: {station.swaps}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </CardContent>
        </Card>
    </div>
  );
}
