import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

const database_name = "EcolithSwap.db";
const database_version = "1.0";
const database_displayname = "EcolithSwap Database";
const database_size = 200000;

let db;

export const initializeDatabase = async () => {
  try {
    db = await SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    );
    
    console.log('Database opened successfully');
    await createTables();
    return db;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

const createTables = async () => {
  try {
    // Offline cache table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS offline_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        data TEXT,
        timestamp INTEGER
      )
    `);

    // Pending actions table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS pending_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT,
        data TEXT,
        timestamp INTEGER,
        synced INTEGER DEFAULT 0
      )
    `);

    // Local stations cache
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS stations_cache (
        id TEXT PRIMARY KEY,
        name TEXT,
        address TEXT,
        latitude REAL,
        longitude REAL,
        station_type TEXT,
        available_batteries INTEGER,
        total_slots INTEGER,
        is_active INTEGER,
        accepts_plastic INTEGER,
        self_service INTEGER,
        last_updated INTEGER
      )
    `);

    // Local user stats cache
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS user_stats_cache (
        user_id TEXT PRIMARY KEY,
        total_swaps INTEGER DEFAULT 0,
        plastic_recycled REAL DEFAULT 0,
        co2_saved REAL DEFAULT 0,
        money_saved REAL DEFAULT 0,
        current_points INTEGER DEFAULT 0,
        last_updated INTEGER
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

export const databaseService = {
  // Cache operations
  async setCache(key, data) {
    try {
      const timestamp = Date.now();
      await db.executeSql(
        'INSERT OR REPLACE INTO offline_cache (key, data, timestamp) VALUES (?, ?, ?)',
        [key, JSON.stringify(data), timestamp]
      );
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  },

  async getCache(key) {
    try {
      const [results] = await db.executeSql(
        'SELECT data FROM offline_cache WHERE key = ?',
        [key]
      );
      
      if (results.rows.length > 0) {
        return JSON.parse(results.rows.item(0).data);
      }
      return null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  },

  async clearCache() {
    try {
      await db.executeSql('DELETE FROM offline_cache');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Pending actions
  async addPendingAction(actionType, data) {
    try {
      const timestamp = Date.now();
      await db.executeSql(
        'INSERT INTO pending_actions (action_type, data, timestamp) VALUES (?, ?, ?)',
        [actionType, JSON.stringify(data), timestamp]
      );
    } catch (error) {
      console.error('Error adding pending action:', error);
    }
  },

  async getPendingActions() {
    try {
      const [results] = await db.executeSql(
        'SELECT * FROM pending_actions WHERE synced = 0 ORDER BY timestamp'
      );
      
      const actions = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        actions.push({
          id: row.id,
          type: row.action_type,
          data: JSON.parse(row.data),
          timestamp: row.timestamp,
        });
      }
      return actions;
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  },

  async markActionSynced(actionId) {
    try {
      await db.executeSql(
        'UPDATE pending_actions SET synced = 1 WHERE id = ?',
        [actionId]
      );
    } catch (error) {
      console.error('Error marking action as synced:', error);
    }
  },

  // Stations cache
  async cacheStations(stations) {
    try {
      // Clear existing cache
      await db.executeSql('DELETE FROM stations_cache');
      
      // Insert new data
      const timestamp = Date.now();
      for (const station of stations) {
        await db.executeSql(`
          INSERT INTO stations_cache 
          (id, name, address, latitude, longitude, station_type, available_batteries, total_slots, is_active, accepts_plastic, self_service, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          station.id,
          station.name,
          station.address,
          station.latitude,
          station.longitude,
          station.station_type,
          station.available_batteries,
          station.total_slots,
          station.is_active ? 1 : 0,
          station.accepts_plastic ? 1 : 0,
          station.self_service ? 1 : 0,
          timestamp
        ]);
      }
    } catch (error) {
      console.error('Error caching stations:', error);
    }
  },

  async getCachedStations() {
    try {
      const [results] = await db.executeSql(
        'SELECT * FROM stations_cache WHERE is_active = 1'
      );
      
      const stations = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        stations.push({
          id: row.id,
          name: row.name,
          address: row.address,
          latitude: row.latitude,
          longitude: row.longitude,
          station_type: row.station_type,
          available_batteries: row.available_batteries,
          total_slots: row.total_slots,
          is_active: row.is_active === 1,
          accepts_plastic: row.accepts_plastic === 1,
          self_service: row.self_service === 1,
        });
      }
      return stations;
    } catch (error) {
      console.error('Error getting cached stations:', error);
      return [];
    }
  },

  // User stats cache
  async cacheUserStats(userId, stats) {
    try {
      const timestamp = Date.now();
      await db.executeSql(`
        INSERT OR REPLACE INTO user_stats_cache 
        (user_id, total_swaps, plastic_recycled, co2_saved, money_saved, current_points, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        stats.totalSwaps,
        stats.plasticRecycled,
        stats.co2Saved,
        stats.moneySaved,
        stats.currentPoints,
        timestamp
      ]);
    } catch (error) {
      console.error('Error caching user stats:', error);
    }
  },

  async getCachedUserStats(userId) {
    try {
      const [results] = await db.executeSql(
        'SELECT * FROM user_stats_cache WHERE user_id = ?',
        [userId]
      );
      
      if (results.rows.length > 0) {
        const row = results.rows.item(0);
        return {
          totalSwaps: row.total_swaps,
          plasticRecycled: row.plastic_recycled,
          co2Saved: row.co2_saved,
          moneySaved: row.money_saved,
          currentPoints: row.current_points,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting cached user stats:', error);
      return null;
    }
  },

  // Database maintenance
  async getDbSize() {
    try {
      const [results] = await db.executeSql("PRAGMA page_count");
      const pageCount = results.rows.item(0).page_count;
      return pageCount * 1024; // Approximate size in bytes
    } catch (error) {
      console.error('Error getting database size:', error);
      return 0;
    }
  },

  async vacuum() {
    try {
      await db.executeSql('VACUUM');
      console.log('Database vacuumed successfully');
    } catch (error) {
      console.error('Error vacuuming database:', error);
    }
  },
};

export default databaseService;
