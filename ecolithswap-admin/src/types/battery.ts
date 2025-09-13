export interface Battery {
    id: string;
    battery_code: string;
    serial_number: string;
    model: string;
    manufacturer: string;
    capacity_kwh: number;
    current_charge_percentage: number;
    status: 'available' | 'rented' | 'charging' | 'maintenance' | 'retired';
    health_status: 'excellent' | 'good' | 'fair' | 'poor';
    cycle_count: number;
    created_at: string;
    updated_at: string;
    current_station_id: string | null;
    station_name: string | null;
    notes: string | null;
    image_url: string | null;
  }
  
  export interface BatteryStats {
    name: string;
    value: number;
    color: string;
  }
  