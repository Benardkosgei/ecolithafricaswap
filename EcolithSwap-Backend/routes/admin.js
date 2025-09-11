const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview statistics
router.get('/dashboard', requireAdminOrManager, async (req, res) => {
  try {
    const stats = await Promise.all([
      // Users
      db('users').count('id as count').first(),
      db('users').where('is_active', true).count('id as count').first(),
      db('users').where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).count('id as count').first(),
      
      // Batteries
      db('batteries').count('id as count').first(),
      db('batteries').where('status', 'available').count('id as count').first(),
      db('batteries').where('status', 'rented').count('id as count').first(),
      
      // Stations
      db('stations').count('id as count').first(),
      db('stations').where('is_active', true).count('id as count').first(),
      
      // Rentals
      db('battery_rentals').count('id as count').first(),
      db('battery_rentals').where('status', 'active').count('id as count').first(),
      db('battery_rentals').where('status', 'completed').sum('total_cost as total').first(),
      
      // Waste
      db('plastic_waste_logs').where('status', 'verified').sum('verified_weight_kg as total').first(),
      db('plastic_waste_logs').where('status', 'pending_verification').count('id as count').first(),
      
      // Payments
      db('payments').where('status', 'completed').sum('amount as total').first(),
      db('payments').where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)).where('status', 'completed').sum('amount as total').first()
    ]);

    res.json({
      users: {
        total: stats[0].count,
        active: stats[1].count,
        newThisMonth: stats[2].count
      },
      batteries: {
        total: stats[3].count,
        available: stats[4].count,
        rented: stats[5].count
      },
      stations: {
        total: stats[6].count,
        active: stats[7].count
      },
      rentals: {
        total: stats[8].count,
        active: stats[9].count,
        totalRevenue: stats[10].total || 0
      },
      waste: {
        totalProcessed: stats[11].total || 0,
        pendingVerification: stats[12].count
      },
      payments: {
        totalRevenue: stats[13].total || 0,
        revenueToday: stats[14].total || 0
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activities
router.get('/activities', requireAdminOrManager, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent user registrations
    const recentUsers = await db('users')
      .select('id', 'full_name', 'email', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(5);

    // Get recent rentals
    const recentRentals = await db('battery_rentals')
      .select(
        'battery_rentals.id',
        'battery_rentals.status',
        'battery_rentals.created_at',
        'users.full_name as user_name',
        'batteries.serial_number as battery_serial'
      )
      .leftJoin('users', 'battery_rentals.user_id', 'users.id')
      .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
      .orderBy('battery_rentals.created_at', 'desc')
      .limit(5);

    // Get recent waste submissions
    const recentWaste = await db('plastic_waste_logs')
      .select(
        'plastic_waste_logs.id',
        'plastic_waste_logs.waste_type',
        'plastic_waste_logs.weight_kg',
        'plastic_waste_logs.status',
        'plastic_waste_logs.created_at',
        'users.full_name as user_name'
      )
      .leftJoin('users', 'plastic_waste_logs.user_id', 'users.id')
      .orderBy('plastic_waste_logs.created_at', 'desc')
      .limit(5);

    // Get recent payments
    const recentPayments = await db('payments')
      .select(
        'payments.id',
        'payments.amount',
        'payments.payment_method',
        'payments.status',
        'payments.created_at',
        'users.full_name as user_name'
      )
      .leftJoin('users', 'payments.user_id', 'users.id')
      .orderBy('payments.created_at', 'desc')
      .limit(5);

    res.json({
      recentUsers,
      recentRentals,
      recentWaste,
      recentPayments
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', requireAdminOrManager, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Revenue by day
    const revenueByDay = await db('payments')
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(*) as transactions')
      )
      .where('status', 'completed')
      .where('created_at', '>=', startDate)
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    // Revenue by payment method
    const revenueByMethod = await db('payments')
      .select('payment_method')
      .sum('amount as revenue')
      .count('id as transactions')
      .where('status', 'completed')
      .where('created_at', '>=', startDate)
      .groupBy('payment_method');

    res.json({
      period,
      revenueByDay,
      revenueByMethod
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get usage analytics
router.get('/analytics/usage', requireAdminOrManager, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Rentals by day
    const rentalsByDay = await db('battery_rentals')
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('COUNT(*) as rentals')
      )
      .where('created_at', '>=', startDate)
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    // Most popular stations
    const popularStations = await db('battery_rentals')
      .select(
        'stations.name as station_name',
        'stations.location',
        db.raw('COUNT(*) as rental_count')
      )
      .leftJoin('stations', 'battery_rentals.pickup_station_id', 'stations.id')
      .where('battery_rentals.created_at', '>=', startDate)
      .groupBy('stations.id', 'stations.name', 'stations.location')
      .orderBy('rental_count', 'desc')
      .limit(10);

    // Battery usage efficiency
    const batteryUsage = await db('batteries')
      .select(
        'model',
        db.raw('COUNT(*) as total_batteries'),
        db.raw('AVG(cycle_count) as avg_cycle_count')
      )
      .where('created_at', '>=', startDate)
      .groupBy('model')
      .orderBy('total_batteries', 'desc');

    res.json({
      period,
      rentalsByDay,
      popularStations,
      batteryUsage
    });

  } catch (error) {
    console.error('Get usage analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch usage analytics' });
  }
});

// System health check
router.get('/health', requireAdminOrManager, async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    
    // Get system stats
    const systemStats = {
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    // Check for critical issues
    const criticalIssues = [];
    
    // Check for batteries needing maintenance
    const batteriesNeedingMaintenance = await db('batteries')
      .where('health_status', 'poor')
      .count('id as count')
      .first();
    
    if (batteriesNeedingMaintenance.count > 0) {
      criticalIssues.push({
        type: 'maintenance',
        message: `${batteriesNeedingMaintenance.count} batteries need maintenance`,
        count: batteriesNeedingMaintenance.count
      });
    }

    // Check for pending waste verifications
    const pendingWaste = await db('plastic_waste_logs')
      .where('status', 'pending_verification')
      .count('id as count')
      .first();
    
    if (pendingWaste.count > 10) {
      criticalIssues.push({
        type: 'waste_verification',
        message: `${pendingWaste.count} waste submissions pending verification`,
        count: pendingWaste.count
      });
    }

    res.json({
      status: 'healthy',
      systemStats,
      criticalIssues
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// Export data (admin only)
router.get('/export/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { start_date, end_date } = req.query;

    let data;
    let filename;

    switch (type) {
      case 'users':
        data = await db('users')
          .select('id', 'email', 'full_name', 'phone', 'location', 'role', 'is_active', 'created_at')
          .orderBy('created_at', 'desc');
        filename = 'users_export.json';
        break;
        
      case 'rentals':
        let query = db('battery_rentals')
          .select(
            'battery_rentals.*',
            'users.full_name as user_name',
            'batteries.serial_number as battery_serial'
          )
          .leftJoin('users', 'battery_rentals.user_id', 'users.id')
          .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
          .orderBy('battery_rentals.created_at', 'desc');
          
        if (start_date) query = query.where('battery_rentals.created_at', '>=', start_date);
        if (end_date) query = query.where('battery_rentals.created_at', '<=', end_date);
        
        data = await query;
        filename = 'rentals_export.json';
        break;
        
      case 'payments':
        let paymentQuery = db('payments')
          .select(
            'payments.*',
            'users.full_name as user_name'
          )
          .leftJoin('users', 'payments.user_id', 'users.id')
          .orderBy('payments.created_at', 'desc');
          
        if (start_date) paymentQuery = paymentQuery.where('payments.created_at', '>=', start_date);
        if (end_date) paymentQuery = paymentQuery.where('payments.created_at', '<=', end_date);
        
        data = await paymentQuery;
        filename = 'payments_export.json';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.json(data);

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;