export interface Battery {
    id: string;
    battery_code: string;
    serial_number: string;
    status: 'Available' | 'In-Use' | 'Charging' | 'Maintenance';
    charge_percentage: number;
    health: number;
    station_id: string | null;
  }
  
  export interface Station {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    station_type: 'swap' | 'charge' | 'both';
    total_slots: number;
    operating_hours: string;
    status: 'Active' | 'Inactive' | 'Maintenance';
    in_maintenance: boolean;
    contact_info: string;
    manager_id: string;
    accepts_plastic: boolean;
    self_service: boolean;
    image_url: string | null;
    batteries?: Battery[];
    availableBatteries?: number;
    inUseBatteries?: number;
  }
  
  export interface Rental {
    id: string;
    user: { name: string };
    battery: { battery_code: string };
    start_time: string;
    status: 'Ongoing' | 'Completed';
  }
  