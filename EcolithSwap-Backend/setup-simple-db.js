const db = require('./config/database');
const bcrypt = require('bcryptjs');

// Simple database setup for demo purposes
async function setupSimpleDatabase() {
  try {
    console.log('🗄️  Setting up simple database...');
    
    // Drop existing tables if they exist
    await db.schema.dropTableIfExists('battery_rentals');
    await db.schema.dropTableIfExists('plastic_waste_logs');
    await db.schema.dropTableIfExists('payments');
    await db.schema.dropTableIfExists('user_profiles');
    await db.schema.dropTableIfExists('batteries');
    await db.schema.dropTableIfExists('stations');
    await db.schema.dropTableIfExists('users');
    
    // Create users table
    await db.schema.createTable('users', function(table) {
      table.increments('id').primary();
      table.string('email').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('full_name').notNullable();
      table.string('phone').unique();
      table.string('location');
      table.string('role').defaultTo('customer');
      table.boolean('is_active').defaultTo(true);
      table.boolean('email_verified').defaultTo(false);
      table.boolean('phone_verified').defaultTo(false);
      table.string('verification_token');
      table.timestamp('last_login');
      table.timestamps(true, true);
    });
    
    // Create stations table
    await db.schema.createTable('stations', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('address').notNullable();
      table.decimal('latitude', 10, 8);
      table.decimal('longitude', 11, 8);
      table.string('station_type').notNullable().defaultTo('both'); // swap, charge, both
      table.integer('available_batteries').defaultTo(0);
      table.integer('total_slots').notNullable().defaultTo(10);
      table.boolean('is_active').defaultTo(true);
      table.boolean('accepts_plastic').defaultTo(true);
      table.boolean('self_service').defaultTo(false);
      table.boolean('maintenance_mode').defaultTo(false);
      table.text('operating_hours');
      table.text('contact_info');
      table.string('manager_name');
      table.string('manager_email');
      table.string('manager_phone');
      table.string('image_url');
      table.timestamps(true, true);
    });
    
    // Create batteries table
    await db.schema.createTable('batteries', function(table) {
      table.increments('id').primary();
      table.string('battery_code').unique();
      table.string('serial_number').unique().notNullable();
      table.string('model').notNullable();
      table.string('manufacturer');
      table.decimal('capacity_kwh', 8, 2).notNullable();
      table.decimal('current_charge_percentage', 5, 2).defaultTo(100);
      table.string('status').defaultTo('available'); // available, rented, charging, maintenance, retired
      table.string('health_status').defaultTo('excellent'); // excellent, good, fair, poor, critical
      table.integer('cycle_count').defaultTo(0);
      table.date('manufacture_date');
      table.date('last_maintenance_date');
      table.date('next_maintenance_due');
      table.integer('current_station_id').references('id').inTable('stations');
      table.text('notes');
      table.timestamps(true, true);
    });
    
    // Create user_profiles table
    await db.schema.createTable('user_profiles', function(table) {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('total_credits_earned').defaultTo(0);
      table.integer('available_credits').defaultTo(0);
      table.integer('pending_credits').defaultTo(0);
      table.timestamps(true, true);
    });
    
    console.log('✅ Tables created successfully');
    
    // Insert sample data
    console.log('👥 Creating sample users...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Insert admin user
    await db('users').insert({
      email: 'admin@ecolithswap.com',
      password_hash: hashedPassword,
      full_name: 'System Administrator',
      phone: '+254700000001',
      location: 'Nairobi, Kenya',
      role: 'admin',
      is_active: true,
      email_verified: true
    });
    
    // Insert station manager
    await db('users').insert({
      email: 'manager@ecolithswap.com',
      password_hash: hashedPassword,
      full_name: 'Station Manager',
      phone: '+254700000002',
      location: 'Nairobi, Kenya',
      role: 'station_manager',
      is_active: true,
      email_verified: true
    });
    
    console.log('🏢 Creating sample stations...');
    
    const stations = [
      {
        name: 'Downtown Mall Station',
        address: '123 Main Street, Downtown, Nairobi',
        latitude: -1.286389,
        longitude: 36.817223,
        station_type: 'both',
        total_slots: 20,
        available_batteries: 18,
        is_active: true,
        accepts_plastic: true,
        self_service: true,
        maintenance_mode: false,
        operating_hours: '24/7',
        contact_info: '+254 700 123456',
        manager_name: 'John Kiprotich',
        manager_email: 'john.k@ecolithswap.com',
        manager_phone: '+254 700 123456'
      },
      {
        name: 'Central Park Station',
        address: '456 Park Avenue, Central Business District',
        latitude: -1.291590,
        longitude: 36.821946,
        station_type: 'swap',
        total_slots: 15,
        available_batteries: 3,
        is_active: true,
        accepts_plastic: true,
        self_service: true,
        maintenance_mode: false,
        operating_hours: '6:00 AM - 10:00 PM',
        contact_info: '+254 700 654321',
        manager_name: 'Mary Wanjiku',
        manager_email: 'mary.w@ecolithswap.com',
        manager_phone: '+254 700 654321'
      },
      {
        name: 'Tech Hub Station',
        address: '789 Innovation Drive, Tech District',
        latitude: -1.300000,
        longitude: 36.850000,
        station_type: 'charge',
        total_slots: 25,
        available_batteries: 22,
        is_active: true,
        accepts_plastic: false,
        self_service: true,
        maintenance_mode: false,
        operating_hours: '24/7',
        contact_info: 'support@ecolithswap.com'
      },
      {
        name: 'University Campus Station',
        address: '321 Campus Road, University District',
        latitude: -1.270000,
        longitude: 36.800000,
        station_type: 'both',
        total_slots: 18,
        available_batteries: 0,
        is_active: false,
        accepts_plastic: true,
        self_service: false,
        maintenance_mode: true,
        operating_hours: '6:00 AM - 8:00 PM',
        contact_info: '+254 700 987654',
        manager_name: 'Peter Mwangi',
        manager_email: 'peter.m@ecolithswap.com',
        manager_phone: '+254 700 987654'
      }
    ];
    
    await db('stations').insert(stations);
    
    console.log('🔋 Creating sample batteries...');
    
    const batteries = [
      { serial_number: 'BAT001', model: 'EcoLith Pro 5000', capacity_kwh: 5.0, current_charge_percentage: 100, current_station_id: 1 },
      { serial_number: 'BAT002', model: 'EcoLith Pro 5000', capacity_kwh: 5.0, current_charge_percentage: 85, current_station_id: 1 },
      { serial_number: 'BAT003', model: 'EcoLith Pro 7500', capacity_kwh: 7.5, current_charge_percentage: 92, current_station_id: 2 },
      { serial_number: 'BAT004', model: 'EcoLith Pro 5000', capacity_kwh: 5.0, current_charge_percentage: 78, current_station_id: 2 },
      { serial_number: 'BAT005', model: 'EcoLith Pro 7500', capacity_kwh: 7.5, current_charge_percentage: 95, current_station_id: 3 }
    ];
    
    await db('batteries').insert(batteries);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@ecolithswap.com / password123');
    console.log('   Manager: manager@ecolithswap.com / password123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  setupSimpleDatabase().then(() => {
    console.log('Database setup complete!');
    process.exit(0);
  }).catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupSimpleDatabase };
