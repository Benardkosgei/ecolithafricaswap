const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config();

// Sample data
const sampleUsers = [
  {
    email: 'admin@ecolithswap.com',
    password_hash: null, // Will be set below
    full_name: 'System Administrator',
    phone: '+254700000001',
    location: 'Nairobi, Kenya',
    role: 'admin',
    is_active: true
  },
  {
    email: 'manager@ecolithswap.com',
    password_hash: null,
    full_name: 'Station Manager',
    phone: '+254700000002',
    location: 'Nairobi, Kenya',
    role: 'station_manager',
    is_active: true
  },
  {
    email: 'john.doe@email.com',
    password_hash: null,
    full_name: 'John Doe',
    phone: '+254700000003',
    location: 'Nairobi, Kenya',
    role: 'customer',
    is_active: true
  },
  {
    email: 'jane.smith@email.com',
    password_hash: null,
    full_name: 'Jane Smith',
    phone: '+254700000004',
    location: 'Mombasa, Kenya',
    role: 'customer',
    is_active: true
  }
];

const sampleStations = [
  {
    name: 'Nairobi CBD Station',
    location: 'Central Business District, Nairobi',
    latitude: -1.2864,
    longitude: 36.8172,
    address: 'Tom Mboya Street, Nairobi',
    phone: '+254700000101',
    operating_hours: '06:00-22:00',
    is_active: true
  },
  {
    name: 'Westlands Station',
    location: 'Westlands, Nairobi',
    latitude: -1.2630,
    longitude: 36.8063,
    address: 'Westlands Road, Nairobi',
    phone: '+254700000102',
    operating_hours: '06:00-22:00',
    is_active: true
  },
  {
    name: 'Mombasa Station',
    location: 'Mombasa City',
    latitude: -4.0435,
    longitude: 39.6682,
    address: 'Moi Avenue, Mombasa',
    phone: '+254700000103',
    operating_hours: '06:00-22:00',
    is_active: true
  },
  {
    name: 'Kisumu Station',
    location: 'Kisumu City',
    latitude: -0.0917,
    longitude: 34.7680,
    address: 'Oginga Odinga Street, Kisumu',
    phone: '+254700000104',
    operating_hours: '06:00-22:00',
    is_active: true
  },
  {
    name: 'Karen Station',
    location: 'Karen, Nairobi',
    latitude: -1.3197,
    longitude: 36.6859,
    address: 'Karen Road, Nairobi',
    phone: '+254700000105',
    operating_hours: '06:00-22:00',
    is_active: true
  }
];

const sampleBatteries = [
  { serial_number: 'ECOL-BAT-001', battery_type: 'Lithium-Ion', capacity: 5000, charge_level: 100, health_status: 'good', status: 'available' },
  { serial_number: 'ECOL-BAT-002', battery_type: 'Lithium-Ion', capacity: 5000, charge_level: 85, health_status: 'good', status: 'available' },
  { serial_number: 'ECOL-BAT-003', battery_type: 'Lithium-Ion', capacity: 5000, charge_level: 92, health_status: 'good', status: 'available' },
  { serial_number: 'ECOL-BAT-004', battery_type: 'Lithium-Ion', capacity: 7500, charge_level: 78, health_status: 'good', status: 'available' },
  { serial_number: 'ECOL-BAT-005', battery_type: 'Lithium-Ion', capacity: 7500, charge_level: 95, health_status: 'good', status: 'available' },
  { serial_number: 'ECOL-BAT-006', battery_type: 'Lithium-Ion', capacity: 5000, charge_level: 88, health_status: 'good', status: 'available' },
  { serial_number: 'ECOL-BAT-007', battery_type: 'Lithium-Ion', capacity: 7500, charge_level: 100, health_status: 'good', status: 'available' },
  { serial_number: 'ECOL-BAT-008', battery_type: 'Lithium-Ion', capacity: 5000, charge_level: 65, health_status: 'fair', status: 'available' },
  { serial_number: 'ECOL-BAT-009', battery_type: 'Lithium-Ion', capacity: 7500, charge_level: 90, health_status: 'good', status: 'available' },
  { serial_number: 'ECOL-BAT-010', battery_type: 'Lithium-Ion', capacity: 5000, charge_level: 100, health_status: 'good', status: 'available' }
];

// Function to hash passwords
async function hashPasswords() {
  const defaultPassword = 'password123';
  
  for (let user of sampleUsers) {
    user.password_hash = await bcrypt.hash(defaultPassword, 12);
  }
}

// Function to seed the database
async function seedDatabase() {
  const trx = await db.transaction();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if data already exists
    const existingUsers = await trx('users').count('id as count').first();
    if (existingUsers.count > 0) {
      console.log('⚠️  Database already contains data. Skipping seeding.');
      await trx.rollback();
      return;
    }
    
    // Hash passwords
    await hashPasswords();
    
    // Insert users
    console.log('👥 Seeding users...');
    const userIds = await trx('users').insert(sampleUsers);
    
    // Insert user profiles
    console.log('📋 Creating user profiles...');
    const userProfiles = userIds.map((id, index) => ({
      user_id: id,
      total_credits_earned: index === 2 ? 150 : index === 3 ? 89 : 0, // Give some credits to sample customers
      available_credits: index === 2 ? 150 : index === 3 ? 89 : 0,
      pending_credits: 0
    }));
    await trx('user_profiles').insert(userProfiles);
    
    // Insert stations
    console.log('🏢 Seeding stations...');
    const stationIds = await trx('stations').insert(sampleStations);
    
    // Insert batteries and assign to stations
    console.log('🔋 Seeding batteries...');
    const batteriesWithStations = sampleBatteries.map((battery, index) => ({
      ...battery,
      station_id: stationIds[index % stationIds.length] // Distribute batteries across stations
    }));
    await trx('batteries').insert(batteriesWithStations);
    
    await trx.commit();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Seeded data:');
    console.log(`   - ${sampleUsers.length} users (including admin and station manager)`);
    console.log(`   - ${sampleStations.length} charging stations`);
    console.log(`   - ${sampleBatteries.length} batteries`);
    console.log('\n🔑 Default login credentials:');
    console.log('   Admin: admin@ecolithswap.com / password123');
    console.log('   Manager: manager@ecolithswap.com / password123');
    console.log('   Customer: john.doe@email.com / password123');
    console.log('   Customer: jane.smith@email.com / password123');
    
  } catch (error) {
    await trx.rollback();
    console.error('❌ Error seeding database:', error.message);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Database seeding failed:', error.message);
    process.exit(1);
  });
}

module.exports = { seedDatabase };