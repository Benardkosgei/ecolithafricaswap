import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const initializeSupabase = async () => {
  if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    throw new Error('Supabase URL or anonymous key is not set. Please check your .env file.');
  }
  try {
    // Initialize database tables if needed
    console.log('Supabase initialized successfully');
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
};

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database table schemas for reference:
/*
  -- Users table (handled by Supabase Auth)
  -- Extended user profiles
  CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    phone TEXT,
    location TEXT,
    total_swaps INTEGER DEFAULT 0,
    plastic_recycled DECIMAL DEFAULT 0,
    co2_saved DECIMAL DEFAULT 0,
    money_saved DECIMAL DEFAULT 0,
    current_points INTEGER DEFAULT .env,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Battery swap stations
  CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    station_type TEXT NOT NULL CHECK (station_type IN ('swap', 'charge', 'both')),
    available_batteries INTEGER DEFAULT 0,
    total_slots INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    accepts_plastic BOOLEAN DEFAULT true,
    self_service BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Battery rentals
  CREATE TABLE battery_rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    station_id UUID REFERENCES stations(id),
    battery_id TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    cost DECIMAL,
    payment_status TEXT DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Plastic waste logs
  CREATE TABLE plastic_waste_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    station_id UUID REFERENCES stations(id),
    weight_kg DECIMAL NOT NULL,
    points_earned INTEGER NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Payments
  CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    rental_id UUID REFERENCES battery_rentals(id),
    amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'KES',
    payment_method TEXT NOT NULL,
    payment_reference TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
*/
