const express = require('express');
const db = require('../config/database');
const { requireAdmin, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Get comprehensive analytics overview
router.get('/overview', requireAdminOrManager, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
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
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const analytics = await Promise.all([
      // User growth
      db('users').where('created_at', '>=', startDate).count('id as count').first(),
      
      // Revenue metrics
      db('payments').where('status', 'completed').where('created_at', '>=', startDate).sum('amount as total').first(),
      
      // Rental metrics
      db('battery_rentals').where('created_at', '>=', startDate).count('id as count').first(),
      db('battery_rentals').where('status', 'completed').where('created_at', '>=', startDate).avg('total_cost as avg_cost').first(),
      
      // Environmental impact
      db('plastic_waste_logs').where('status', 'verified').where('created_at', '>=', startDate).sum('verified_weight_kg as total').first(),
      db('plastic_waste_logs').where('status', 'verified').where('created_at', '>=', startDate).sum('credit_earned as total').first(),
      
      // Battery utilization
      db('batteries').where('status', 'rented').count('id as count').first(),
      db('batteries').count('id as count').first(),
      
      // Station performance
      db('stations').where('is_active', true).count('id as count').first()
    ]);

    const batteryUtilization = analytics[7].count > 0 ? (analytics[6].count / analytics[7].count) * 100 : 0;

    res.json({
      period,
      startDate,
      metrics: {
        userGrowth: analytics[0].count,
        revenue: analytics[1].total || 0,
        totalRentals: analytics[2].count,
        avgRentalCost: parseFloat(analytics[3].avg_cost) || 0,
        plasticWasteProcessed: analytics[4].total || 0,
        creditsAwarded: analytics[5].total || 0,
        batteryUtilization: parseFloat(batteryUtilization.toFixed(2)),
        activeStations: analytics[8].count
      }
    });

  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// Get time-series data
router.get('/timeseries', requireAdminOrManager, async (req, res) => {
  try {
    const { metric = 'revenue', period = '30d' } = req.query;
    
    let startDate;
    let groupBy;
    
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        groupBy = 'HOUR(created_at)';
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(created_at)';
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(created_at)';
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        groupBy = 'WEEK(created_at)';
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(created_at)';
    }

    let data;
    
    switch (metric) {
      case 'revenue':
        data = await db('payments')
          .select(
            db.raw(`${groupBy} as period`),
            db.raw('SUM(amount) as value'),
            db.raw('DATE(created_at) as date')
          )
          .where('status', 'completed')
          .where('created_at', '>=', startDate)
          .groupBy(db.raw(groupBy))
          .orderBy('date', 'asc');
        break;
        
      case 'rentals':
        data = await db('battery_rentals')
          .select(
            db.raw(`${groupBy} as period`),
            db.raw('COUNT(*) as value'),
            db.raw('DATE(created_at) as date')
          )
          .where('created_at', '>=', startDate)
          .groupBy(db.raw(groupBy))
          .orderBy('date', 'asc');
        break;
        
      case 'users':
        data = await db('users')
          .select(
            db.raw(`${groupBy} as period`),
            db.raw('COUNT(*) as value'),
            db.raw('DATE(created_at) as date')
          )
          .where('created_at', '>=', startDate)
          .groupBy(db.raw(groupBy))
          .orderBy('date', 'asc');
        break;
        
      case 'waste':
        data = await db('plastic_waste_logs')
          .select(
            db.raw(`${groupBy} as period`),
            db.raw('SUM(verified_weight_kg) as value'),
            db.raw('DATE(created_at) as date')
          )
          .where('status', 'verified')
          .where('created_at', '>=', startDate)
          .groupBy(db.raw(groupBy))
          .orderBy('date', 'asc');
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid metric type' });
    }

    res.json({
      metric,
      period,
      data
    });

  } catch (error) {
    console.error('Get timeseries data error:', error);
    res.status(500).json({ error: 'Failed to fetch timeseries data' });
  }
});

// Get user analytics
router.get('/users', requireAdminOrManager, async (req, res) => {
  try {
    const userStats = await Promise.all([
      // User distribution by role
      db('users').select('role').count('id as count').groupBy('role'),
      
      // User activity over time
      db('users')
        .select(db.raw('DATE(created_at) as date'))
        .count('id as new_users')
        .where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date', 'asc'),
      
      // Most active users (by rentals)
      db('battery_rentals')
        .select(
          'users.full_name',
          'users.email',
          db.raw('COUNT(*) as rental_count'),
          db.raw('SUM(total_cost) as total_spent')
        )
        .leftJoin('users', 'battery_rentals.user_id', 'users.id')
        .where('battery_rentals.status', 'completed')
        .groupBy('users.id', 'users.full_name', 'users.email')
        .orderBy('rental_count', 'desc')
        .limit(10),
      
      // User retention (users who made multiple rentals)
      db.raw(`
        SELECT 
          COUNT(DISTINCT user_id) as returning_users
        FROM battery_rentals 
        WHERE user_id IN (
          SELECT user_id 
          FROM battery_rentals 
          GROUP BY user_id 
          HAVING COUNT(*) > 1
        )
      `)
    ]);

    res.json({
      roleDistribution: userStats[0],
      userGrowth: userStats[1],
      topUsers: userStats[2],
      returningUsers: userStats[3][0].returning_users
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get environmental impact analytics
router.get('/environmental', requireAdminOrManager, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const environmentalData = await Promise.all([
      // Plastic waste by type
      db('plastic_waste_logs')
        .select('waste_type')
        .sum('verified_weight_kg as total_weight')
        .count('id as submissions')
        .where('status', 'verified')
        .where('created_at', '>=', startDate)
        .groupBy('waste_type')
        .orderBy('total_weight', 'desc'),
      
      // Waste processing over time
      db('plastic_waste_logs')
        .select(db.raw('DATE(created_at) as date'))
        .sum('verified_weight_kg as weight')
        .count('id as submissions')
        .where('status', 'verified')
        .where('created_at', '>=', startDate)
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date', 'asc'),
      
      // Top contributors
      db('plastic_waste_logs')
        .select(
          'users.full_name',
          'users.email',
          db.raw('SUM(verified_weight_kg) as total_weight'),
          db.raw('SUM(credit_earned) as total_credits'),
          db.raw('COUNT(*) as submissions')
        )
        .leftJoin('users', 'plastic_waste_logs.user_id', 'users.id')
        .where('plastic_waste_logs.status', 'verified')
        .where('plastic_waste_logs.created_at', '>=', startDate)
        .groupBy('users.id', 'users.full_name', 'users.email')
        .orderBy('total_weight', 'desc')
        .limit(10),
      
      // Total impact
      db('plastic_waste_logs')
        .sum('verified_weight_kg as total_weight')
        .sum('credit_earned as total_credits')
        .count('id as total_submissions')
        .where('status', 'verified')
        .where('created_at', '>=', startDate)
        .first()
    ]);

    // Calculate CO2 savings (approximate: 1kg plastic = 2.8kg CO2 saved)
    const co2Saved = (environmentalData[3].total_weight || 0) * 2.8;

    res.json({
      period,
      wasteByType: environmentalData[0],
      wasteOverTime: environmentalData[1],
      topContributors: environmentalData[2],
      totalImpact: {
        ...environmentalData[3],
        co2Saved: parseFloat(co2Saved.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Get environmental analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch environmental analytics' });
  }
});

// Get station performance analytics
router.get('/stations', requireAdminOrManager, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
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
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const stationData = await Promise.all([
      // Station utilization (rentals per station)
      db('battery_rentals')
        .select(
          'stations.name as station_name',
          'stations.location',
          'stations.id as station_id',
          db.raw('COUNT(*) as rental_count'),
          db.raw('SUM(total_cost) as revenue')
        )
        .leftJoin('stations', 'battery_rentals.pickup_station_id', 'stations.id')
        .where('battery_rentals.created_at', '>=', startDate)
        .groupBy('stations.id', 'stations.name', 'stations.location')
        .orderBy('rental_count', 'desc'),
      
      // Battery distribution by station
      db('batteries')
        .select(
          'stations.name as station_name',
          'stations.location',
          db.raw('COUNT(*) as battery_count'),
          db.raw('AVG(charge_level) as avg_charge'),
          db.raw('SUM(CASE WHEN batteries.status = "available" THEN 1 ELSE 0 END) as available_count')
        )
        .leftJoin('stations', 'batteries.station_id', 'stations.id')
        .groupBy('stations.id', 'stations.name', 'stations.location')
        .orderBy('battery_count', 'desc'),
      
      // Peak usage hours
      db('battery_rentals')
        .select(db.raw('HOUR(created_at) as hour'))
        .count('id as rental_count')
        .where('created_at', '>=', startDate)
        .groupBy(db.raw('HOUR(created_at)'))
        .orderBy('hour', 'asc')
    ]);

    res.json({
      period,
      stationUtilization: stationData[0],
      batteryDistribution: stationData[1],
      peakHours: stationData[2]
    });

  } catch (error) {
    console.error('Get station analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch station analytics' });
  }
});

// Get financial analytics
router.get('/financial', requireAdminOrManager, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const financialData = await Promise.all([
      // Revenue breakdown by source
      db('payments')
        .select('payment_method')
        .sum('amount as revenue')
        .count('id as transactions')
        .where('status', 'completed')
        .where('created_at', '>=', startDate)
        .groupBy('payment_method')
        .orderBy('revenue', 'desc'),
      
      // Revenue trends
      db('payments')
        .select(db.raw('DATE(created_at) as date'))
        .sum('amount as revenue')
        .count('id as transactions')
        .where('status', 'completed')
        .where('created_at', '>=', startDate)
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date', 'asc'),
      
      // Refund analysis
      db('payments')
        .select('refund_reason')
        .sum('amount as refunded_amount')
        .count('id as refund_count')
        .where('status', 'refunded')
        .where('created_at', '>=', startDate)
        .groupBy('refund_reason'),
      
      // Summary metrics
      db('payments')
        .sum('amount as total_revenue')
        .avg('amount as avg_transaction')
        .count('id as total_transactions')
        .where('status', 'completed')
        .where('created_at', '>=', startDate)
        .first()
    ]);

    res.json({
      period,
      revenueByMethod: financialData[0],
      revenueTrends: financialData[1],
      refundAnalysis: financialData[2],
      summary: financialData[3]
    });

  } catch (error) {
    console.error('Get financial analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
});

// Export analytics data
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { type = 'overview', period = '30d', format = 'json' } = req.query;
    
    let data;
    let filename;
    
    switch (type) {
      case 'overview':
        // Get comprehensive overview data
        data = await Promise.all([
          db('users').count('id as count').first(),
          db('battery_rentals').count('id as count').first(),
          db('payments').where('status', 'completed').sum('amount as total').first(),
          db('plastic_waste_logs').where('status', 'verified').sum('verified_weight_kg as total').first()
        ]);
        
        data = {
          totalUsers: data[0].count,
          totalRentals: data[1].count,
          totalRevenue: data[2].total || 0,
          totalWasteProcessed: data[3].total || 0,
          exportedAt: new Date().toISOString()
        };
        filename = 'analytics_overview.json';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.json(data);
    } else {
      return res.status(400).json({ error: 'Only JSON format is supported' });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

module.exports = router;