const express = require('express');
const { requireAdminOrManager } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get dashboard overview statistics
router.get('/stats', requireAdminOrManager, async (req, res) => {
  try {
    const stats = await Promise.all([
      db('users').count('id as count').first(),
      db('users').where('is_active', true).count('id as count').first(),
      db('users').where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).count('id as count').first(),
      db('batteries').count('id as count').first(),
      db('batteries').where('status', 'available').count('id as count').first(),
      db('batteries').where('status', 'rented').count('id as count').first(),
      db('stations').count('id as count').first(),
      db('stations').where('is_active', true).count('id as count').first(),
      db('battery_rentals').count('id as count').first(),
      db('battery_rentals').where('status', 'active').count('id as count').first(),
      db('battery_rentals').where('status', 'completed').sum('total_cost as total').first(),
      db('waste_logs').where('status', 'verified').sum('verified_weight_kg as total').first(),
      db('waste_logs').where('status', 'pending_verification').count('id as count').first(),
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
    const { limit = 5 } = req.query;

    const recentUsers = await db('users')
      .select('id', 'full_name', 'email', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(limit);

    const recentRentals = await db('battery_rentals')
      .select('battery_rentals.id', 'battery_rentals.status', 'battery_rentals.created_at', 'users.full_name as user_name', 'batteries.serial_number as battery_serial')
      .leftJoin('users', 'battery_rentals.user_id', 'users.id')
      .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
      .orderBy('battery_rentals.created_at', 'desc')
      .limit(limit);

    const recentWaste = await db('waste_logs')
      .select('waste_logs.id', 'waste_logs.waste_type', 'waste_logs.weight_kg', 'waste_logs.status', 'waste_logs.created_at', 'users.full_name as user_name')
      .leftJoin('users', 'waste_logs.user_id', 'users.id')
      .orderBy('waste_logs.created_at', 'desc')
      .limit(limit);

    const recentPayments = await db('payments')
      .select('payments.id', 'payments.amount', 'payments.payment_method', 'payments.status', 'payments.created_at', 'users.full_name as user_name')
      .leftJoin('users', 'payments.user_id', 'users.id')
      .orderBy('payments.created_at', 'desc')
      .limit(limit);

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

module.exports = router;