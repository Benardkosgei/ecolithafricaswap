
export interface DashboardStats {
  totalCustomers: {
    value: number;
    change: number;
  };
  activeBatteries: {
    value: number;
    change: number;
  };
  swapStations: {
    value: number;
    change: number;
  };
  monthlyRevenue: {
    value: number;
    change: number;
  };
  dailySwaps: {
    value: number;
    change: number;
  };
  co2Saved: {
    value: number;
    change: number;
  };
}

export interface AnalyticsData {
  date: string;
  swaps: number;
  revenue: number;
}

export interface BatteryStatus {
  name: string;
  value: number;
  color: string;
}

export interface StationPerformance {
  station: string;
  swaps: number;
  efficiency: number;
}

export interface ActivityItem {
  id: string;
  type: 'swap' | 'customer' | 'station' | 'maintenance' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}
