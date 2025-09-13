import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Battery, MapPin, Power, Wrench, Zap } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const fetchStationDetails = async (stationId: string) => {
  const response = await api.get(`/stations/${stationId}`);
  return response.data;
};

export function StationDetails({ stationId, isOpen, onClose }) {
  const { data: station, isLoading, error } = useQuery({
    queryKey: ['stationDetails', stationId],
    queryFn: () => fetchStationDetails(stationId),
    enabled: !!stationId && isOpen,
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{station?.name ?? 'Loading...'}</DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
        </DialogHeader>
        {isLoading && <div>Loading station details...</div>}
        {error && <div className="text-red-500">Error: {error.message}</div>}
        {station && (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="batteries">Batteries</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Card>
                  <CardHeader><CardTitle>Station Info</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> {station.address}</div>
                    <div className="flex items-center"><Power className="h-4 w-4 mr-2" /> {station.power_type}</div>
                    <p><strong>GPS:</strong> {station.latitude}, {station.longitude}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <Badge>{station.status}</Badge>
                    <p>{station.in_maintenance ? 
                      <span className="text-yellow-600 flex items-center"><Wrench className="h-4 w-4 mr-1"/>Under Maintenance</span> : 
                      <span className="text-green-600">Operational</span>
                    }</p>
                    <p>{station.accepts_plastic ? 'Accepts Plastic' : 'Does not accept plastic'}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="batteries">
              <Card>
                <CardHeader><CardTitle>Battery Inventory</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="h-5 w-5 text-green-500" />
                    <span>{station.available_batteries} Available</span>
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span>{station.charging_batteries} Charging</span>
                  </div>
                  <ul className="space-y-2">
                    {station.batteries?.map(battery => (
                      <li key={battery.id} className="flex justify-between items-center p-2 border rounded-md">
                        <span>{battery.battery_code}</span>
                        <Badge>{battery.status}</Badge>
                        <span>{battery.current_charge_percentage}%</span>
                      </li>
                    )) ?? <p>No battery data available.</p>}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  {/* Activity feed placeholder */}
                  <p>Recent activity will be shown here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="maintenance">
              <Card>
                <CardHeader><CardTitle>Maintenance History</CardTitle></CardHeader>
                <CardContent>
                  {/* Maintenance history placeholder */}
                  <p>Maintenance logs will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
