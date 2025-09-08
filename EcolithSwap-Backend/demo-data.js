// Demo data for testing without MySQL
const bcrypt = require('bcryptjs');

// In-memory data store for demo
const demoData = {
  users: [],
  user_profiles: [],
  stations: [],
  batteries: [],
  battery_rentals: [],
  plastic_waste_logs: [],
  payments: []
};

// Initialize demo data
async function initializeDemoData() {
  try {
    console.log('🎭 Initializing demo data...');
    
    // Create demo users
    const adminPassword = await bcrypt.hash('password123', 12);
    const customerPassword = await bcrypt.hash('password123', 12);
    
    demoData.users = [
      {
        id: 1,
        email: 'admin@ecolithswap.com',
        password_hash: adminPassword,
        full_name: 'System Administrator',
        phone: '+254700000001',
        location: 'Nairobi, Kenya',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        last_login: new Date()
      },
      {
        id: 2,
        email: 'john.doe@email.com',
        password_hash: customerPassword,
        full_name: 'John Doe',
        phone: '+254700000003',
        location: 'Nairobi, Kenya',
        role: 'customer',
        is_active: true,
        created_at: new Date(),
        last_login: new Date()
      },
      {
        id: 3,
        email: 'jane.smith@email.com',
        password_hash: customerPassword,
        full_name: 'Jane Smith',
        phone: '+254700000004',
        location: 'Mombasa, Kenya',
        role: 'customer',
        is_active: true,
        created_at: new Date(),
        last_login: new Date()
      }
    ];

    // Create user profiles
    demoData.user_profiles = [
      {
        id: 1,
        user_id: 1,
        total_credits_earned: 0,
        available_credits: 0,
        pending_credits: 0,
        created_at: new Date()
      },
      {
        id: 2,
        user_id: 2,
        total_credits_earned: 150,
        available_credits: 150,
        pending_credits: 0,
        created_at: new Date()
      },
      {
        id: 3,
        user_id: 3,
        total_credits_earned: 89,
        available_credits: 89,
        pending_credits: 0,
        created_at: new Date()
      }
    ];

    // Create demo stations
    demoData.stations = [
      {
        id: 1,
        name: 'Nairobi CBD Station',
        location: 'Central Business District, Nairobi',
        latitude: -1.2864,
        longitude: 36.8172,
        address: 'Tom Mboya Street, Nairobi',
        phone: '+254700000101',
        operating_hours: '06:00-22:00',
        is_active: true,
        created_at: new Date()
      },
      {
        id: 2,
        name: 'Westlands Station',
        location: 'Westlands, Nairobi',
        latitude: -1.2630,
        longitude: 36.8063,
        address: 'Westlands Road, Nairobi',
        phone: '+254700000102',
        operating_hours: '06:00-22:00',
        is_active: true,
        created_at: new Date()
      },
      {
        id: 3,
        name: 'Mombasa Station',
        location: 'Mombasa City',
        latitude: -4.0435,
        longitude: 39.6682,
        address: 'Moi Avenue, Mombasa',
        phone: '+254700000103',
        operating_hours: '06:00-22:00',
        is_active: true,
        created_at: new Date()
      }
    ];

    // Create demo batteries
    demoData.batteries = [
      {
        id: 1,
        serial_number: 'ECOL-BAT-001',
        battery_type: 'Lithium-Ion',
        capacity: 5000,
        charge_level: 100,
        health_status: 'good',
        status: 'available',
        station_id: 1,
        created_at: new Date()
      },
      {
        id: 2,
        serial_number: 'ECOL-BAT-002',
        battery_type: 'Lithium-Ion',
        capacity: 5000,
        charge_level: 85,
        health_status: 'good',
        status: 'available',
        station_id: 1,
        created_at: new Date()
      },
      {
        id: 3,
        serial_number: 'ECOL-BAT-003',
        battery_type: 'Lithium-Ion',
        capacity: 7500,
        charge_level: 92,
        health_status: 'good',
        status: 'available',
        station_id: 2,
        created_at: new Date()
      }
    ];

    console.log('✅ Demo data initialized successfully');
    console.log(`   - ${demoData.users.length} users created`);
    console.log(`   - ${demoData.stations.length} stations created`);
    console.log(`   - ${demoData.batteries.length} batteries created`);
    
  } catch (error) {
    console.error('❌ Error initializing demo data:', error);
  }
}

// Demo database methods
const demoDb = {
  // Generic query method that returns demo data
  async query(table, conditions = {}) {
    if (!demoData[table]) {
      return [];
    }
    
    let results = [...demoData[table]];
    
    // Apply simple filters
    if (Object.keys(conditions).length > 0) {
      results = results.filter(item => {
        return Object.entries(conditions).every(([key, value]) => {
          return item[key] === value;
        });
      });
    }
    
    return results;
  },

  // Insert method
  async insert(table, data) {
    if (!demoData[table]) {
      demoData[table] = [];
    }
    
    const newId = Math.max(0, ...demoData[table].map(item => item.id || 0)) + 1;
    const newItem = {
      id: newId,
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    demoData[table].push(newItem);
    return [newId];
  },

  // Update method
  async update(table, conditions, updates) {
    if (!demoData[table]) {
      return 0;
    }
    
    let updatedCount = 0;
    demoData[table].forEach(item => {
      const matches = Object.entries(conditions).every(([key, value]) => {
        return item[key] === value;
      });
      
      if (matches) {
        Object.assign(item, updates, { updated_at: new Date() });
        updatedCount++;
      }
    });
    
    return updatedCount;
  },

  // Delete method
  async delete(table, conditions) {
    if (!demoData[table]) {
      return 0;
    }
    
    const initialLength = demoData[table].length;
    demoData[table] = demoData[table].filter(item => {
      return !Object.entries(conditions).every(([key, value]) => {
        return item[key] === value;
      });
    });
    
    return initialLength - demoData[table].length;
  },

  // Find one method
  async findOne(table, conditions = {}) {
    const results = await this.query(table, conditions);
    return results[0] || null;
  },

  // Count method
  async count(table, conditions = {}) {
    const results = await this.query(table, conditions);
    return results.length;
  }
};

module.exports = {
  demoData,
  demoDb,
  initializeDemoData
};
