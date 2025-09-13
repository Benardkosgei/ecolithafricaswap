export interface Customer {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    location: string | null;
    role: 'customer' | 'admin' | 'station_manager';
    is_active: boolean;
    created_at: string;
    last_login: string | null;
  }
  
  export interface CustomerStats {
    totalUsers: number;
    activeUsers: number;
    customers: number;
    admins: number;
    newUsersThisMonth: number;
  }
  