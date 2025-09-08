const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts for dashboard
    const totalUsers = await db('users').count('id as count').first();
    const totalStations = await db('stations').count('id as count').first();
    const totalBatteries = await db('batteries').count('id as count').first();
    const activeStations = await db('stations').where('is_active', true).count('id as count').first();
    const availableBatteries = await db('batteries').where('status', 'available').count('id as count').first();
    const maintenanceStations = await db('stations').where('maintenance_mode', true).count('id as count').first();

    // Calculate some basic metrics
    const stationUtilization = totalStations.count > 0 ? 
      Math.round((activeStations.count / totalStations.count) * 100) : 0;
    
    const batteryAvailability = totalBatteries.count > 0 ? 
      Math.round((availableBatteries.count / totalBatteries.count) * 100) : 0;

    res.json({
      data: {
        totalUsers: totalUsers.count,
        totalStations: totalStations.count,
        totalBatteries: totalBatteries.count,
        activeStations: activeStations.count,
        availableBatteries: availableBatteries.count,
        maintenanceStations: maintenanceStations.count,
        stationUtilization,
        batteryAvailability,
        // Mock additional metrics
        totalSwaps: 1247,
        revenue: 15240.50,
        plasticRecycled: 89.3,
        co2Saved: 234.7
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Mock recent activities data
    const activities = [
      {
        id: 1,
        type: 'battery_swap',
        description: 'Battery swap completed at Downtown Mall Station',
        user: 'John Doe',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 2,
        type: 'station_maintenance',
        description: 'University Campus Station entered maintenance mode',
        user: 'System',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: 'warning'
      },
      {
        id: 3,
        type: 'user_registration',
        description: 'New user registered: jane.smith@email.com',
        user: 'System',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'info'
      },
      {
        id: 4,
        type: 'battery_charging',
        description: 'Battery BAT003 charging completed',
        user: 'System',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: 5,
        type: 'plastic_deposit',
        description: 'Plastic waste deposited at Central Park Station',
        user: 'Mary Johnson',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      }
    ];

    res.json({ 
      data: activities.slice(0, parseInt(limit)) 
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Mock revenue analytics data
    const analytics = {
      totalRevenue: 15240.50,
      monthlyGrowth: 12.5,
      averagePerSwap: 12.25,
      revenueByMonth: [
        { month: 'Jan', revenue: 8500 },
        { month: 'Feb', revenue: 9200 },
        { month: 'Mar', revenue: 11800 },
        { month: 'Apr', revenue: 13400 },
        { month: 'May', revenue: 15240 }
      ],
      topStations: [
        { name: 'Downtown Mall Station', revenue: 4825.50 },
        { name: 'Central Park Station', revenue: 3940.25 },
        { name: 'Tech Hub Station', revenue: 3280.75 },
        { name: 'University Campus Station', revenue: 2194.00 }
      ]
    };

    res.json({ data: analytics });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get usage analytics
router.get('/analytics/usage', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Mock usage analytics data
    const analytics = {
      totalSwaps: 1247,
      averageDaily: 41.6,
      peakHours: '14:00-18:00',
      usageByHour: [
        { hour: '06:00', swaps: 12 },
        { hour: '08:00', swaps: 28 },
        { hour: '10:00', swaps: 35 },
        { hour: '12:00', swaps: 45 },
        { hour: '14:00', swaps: 67 },
        { hour: '16:00', swaps: 72 },
        { hour: '18:00', swaps: 58 },
        { hour: '20:00', swaps: 34 },
        { hour: '22:00', swaps: 18 }
      ],
      popularStations: [
        { name: 'Downtown Mall Station', percentage: 35.2 },
        { name: 'Central Park Station', percentage: 28.7 },
        { name: 'Tech Hub Station', percentage: 22.1 },
        { name: 'University Campus Station', percentage: 14.0 }
      ]
    };

    res.json({ data: analytics });

  } catch (error) {
    console.error('Get usage analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch usage analytics' });
  }
});

// Get system health
router.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await db.raw('SELECT 1');
    
    const health = {
      status: 'healthy',
      database: 'connected',
      apiVersion: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        authentication: 'operational',
        stationManagement: 'operational',
        batteryTracking: 'operational',
        userManagement: 'operational'
      }
    };

    res.json({ data: health });

  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({ 
      data: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

// Export data
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;

    let data, filename;

    switch (type) {
      case 'users':
        data = await db('users').select('id', 'email', 'full_name', 'role', 'is_active', 'created_at');
        filename = 'users.csv';
        break;
      case 'stations':
        data = await db('stations').select('id', 'name', 'address', 'station_type', 'is_active', 'total_slots');
        filename = 'stations.csv';
        break;
      case 'batteries':
        data = await db('batteries').select('id', 'serial_number', 'model', 'status', 'health_status', 'current_charge_percentage');
        filename = 'batteries.csv';
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    // Simple CSV generation
    if (data.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      csv += headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;
