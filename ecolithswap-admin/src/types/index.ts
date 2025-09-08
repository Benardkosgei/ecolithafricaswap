// Common types
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  pagination?: PaginationMeta
  message?: string
}

// User types
export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  location?: string
  role: 'customer' | 'admin' | 'station_manager'
  is_active: boolean
  email_verified: boolean
  phone_verified: boolean
  last_login?: string
  created_at: string
  updated_at: string
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  user_id: string
  avatar_url?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  occupation?: string
  vehicle_type?: string
  vehicle_model?: string
  license_plate?: string
  total_swaps: number
  total_distance_km: number
  total_amount_spent: number
  plastic_recycled_kg: number
  co2_saved_kg: number
  money_saved: number
  current_points: number
  total_points_earned: number
  total_points_redeemed: number
  preferences?: Record<string, any>
  notifications_enabled: boolean
  sms_notifications: boolean
  email_notifications: boolean
  preferred_language: string
  created_at: string
  updated_at: string
}

// Station types
export interface Station {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  station_type: 'swap' | 'charge' | 'both'
  available_batteries: number
  total_slots: number
  is_active: boolean
  accepts_plastic: boolean
  self_service: boolean
  maintenance_mode: boolean
  operating_hours?: string
  contact_info?: string
  manager_id?: string
  manager_name?: string
  manager_email?: string
  manager_phone?: string
  image_url?: string
  created_at: string
  updated_at: string
  battery_count?: number
  batteries?: Battery[]
  recentRentals?: Rental[]
}

// Battery types
export interface Battery {
  id: string
  battery_code: string
  serial_number: string
  model: string
  manufacturer?: string
  capacity_kwh: number
  current_charge_percentage: number
  status: 'available' | 'rented' | 'charging' | 'maintenance' | 'retired'
  health_status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  cycle_count: number
  manufacture_date?: string
  last_maintenance_date?: string
  next_maintenance_due?: string
  current_station_id?: string
  current_rental_id?: string
  station_name?: string
  station_address?: string
  renter_name?: string
  notes?: string
  image_url?: string
  created_at: string
  updated_at: string
}

// Rental types
export interface Rental {
  id: string
  user_id: string
  battery_id: string
  pickup_station_id: string
  return_station_id?: string
  start_time: string
  end_time?: string
  initial_charge_percentage?: number
  final_charge_percentage?: number
  distance_covered_km?: number
  base_cost: number
  hourly_rate: number
  total_cost?: number
  status: 'active' | 'completed' | 'cancelled' | 'overdue'
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  notes?: string
  user_name?: string
  user_email?: string
  battery_serial?: string
  battery_code?: string
  pickup_station_name?: string
  return_station_name?: string
  created_at: string
  updated_at: string
}

// Waste types
export interface WasteLog {
  id: string
  user_id: string
  station_id: string
  weight_kg: number
  points_earned: number
  co2_saved_kg?: number
  plastic_type: 'PET' | 'HDPE' | 'PVC' | 'LDPE' | 'PP' | 'PS' | 'OTHER'
  description?: string
  receipt_number?: string
  verified: boolean
  verified_by?: string
  verified_at?: string
  photos?: Array<{
    filename: string
    originalName: string
    url: string
  }>
  user_name?: string
  user_email?: string
  station_name?: string
  station_address?: string
  logged_at: string
  created_at: string
  updated_at: string
}

// Payment types
export interface Payment {
  id: string
  user_id: string
  rental_id?: string
  amount: number
  currency: string
  payment_method: 'mpesa' | 'card' | 'cash' | 'points' | 'bank_transfer'
  payment_reference?: string
  mpesa_receipt_number?: string
  transaction_id?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  description?: string
  metadata?: Record<string, any>
  processed_at?: string
  fee_amount: number
  user_name?: string
  user_email?: string
  user_phone?: string
  rental_start_time?: string
  rental_end_time?: string
  created_at: string
  updated_at: string
}

// Statistics types
export interface DashboardStats {
  users: {
    total: number
    active: number
    newThisMonth: number
  }
  batteries: {
    total: number
    available: number
    rented: number
  }
  stations: {
    total: number
    active: number
  }
  rentals: {
    total: number
    active: number
    totalRevenue: number
  }
  waste: {
    totalProcessed: number
    pendingVerification: number
  }
  payments: {
    totalRevenue: number
    revenueToday: number
  }
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  customers: number
  admins: number
  newUsersThisMonth: number
}

export interface StationStats {
  totalStations: number
  activeStations: number
  maintenanceStations: number
  swapStations: number
  chargeStations: number
  bothTypeStations: number
  plasticAcceptingStations: number
}

export interface BatteryStats {
  totalBatteries: number
  available: number
  rented: number
  charging: number
  maintenance: number
  needMaintenance: number
}

export interface WasteStats {
  totalSubmissions: number
  verifiedSubmissions: number
  pendingVerification: number
  totalWeightProcessed: number
  totalCreditsAwarded: number
  submissionsToday: number
}

export interface PaymentStats {
  totalPayments: number
  completedPayments: number
  pendingPayments: number
  failedPayments: number
  totalRevenue: number
  revenueInPeriod: number
  paymentMethodStats: Record<string, {
    count: number
    total: number
  }>
  averageTransactionValue: number
  period: string
}

// Analytics types
export interface RevenueAnalytics {
  period: string
  group_by: string
  data: Array<{
    period: string
    revenue: number
    transactions: number
  }>
}

export interface BatteryAnalytics {
  period: string
  statusDistribution: Array<{
    status: string
    count: number
  }>
  healthDistribution: Array<{
    health_status: string
    count: number
    avg_cycles: number
  }>
  mostRentedBatteries: Array<{
    battery_code: string
    model: string
    rental_count: number
  }>
  stationDistribution: Array<{
    station_name: string
    battery_count: number
  }>
}

// Activity types
export interface RecentActivity {
  recentUsers: User[]
  recentRentals: Rental[]
  recentWaste: WasteLog[]
  recentPayments: Payment[]
}

// System health types
export interface SystemHealth {
  status: 'healthy' | 'unhealthy'
  systemStats: {
    database: string
    uptime: number
    memory: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
    }
    timestamp: string
  }
  criticalIssues: Array<{
    type: string
    message: string
    count: number
  }>
}

// Form types
export interface CreateStationData {
  name: string
  address: string
  latitude: number
  longitude: number
  station_type: 'swap' | 'charge' | 'both'
  total_slots: number
  operating_hours?: string
  contact_info?: string
  manager_id?: string
  accepts_plastic?: boolean
  self_service?: boolean
  image?: File
}

export interface CreateBatteryData {
  battery_code: string
  serial_number: string
  model: string
  manufacturer?: string
  capacity_kwh: number
  current_station_id?: string
  manufacture_date?: string
  notes?: string
  image?: File
}

export interface CreatePaymentData {
  user_id: string
  rental_id?: string
  amount: number
  currency?: string
  payment_method: 'mpesa' | 'card' | 'cash' | 'points' | 'bank_transfer'
  payment_reference?: string
  mpesa_receipt_number?: string
  description?: string
  metadata?: Record<string, any>
}

// Filter types
export interface UserFilters {
  search?: string
  role?: string
  is_active?: boolean
}

export interface StationFilters {
  search?: string
  station_type?: string
  is_active?: boolean
  accepts_plastic?: boolean
  maintenance_mode?: boolean
}

export interface BatteryFilters {
  search?: string
  station_id?: string
  status?: string
  health_status?: string
}

export interface RentalFilters {
  user_id?: string
  status?: string
  start_date?: string
  end_date?: string
}

export interface WasteFilters {
  user_id?: string
  plastic_type?: string
  verified?: boolean
  start_date?: string
  end_date?: string
}

export interface PaymentFilters {
  user_id?: string
  status?: string
  payment_method?: string
  start_date?: string
  end_date?: string
  min_amount?: number
  max_amount?: number
}