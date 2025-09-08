const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin, requireAdminOrManager, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all rentals
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, user_id, status } = req.query;
    const offset = (page - 1) * limit;

    let query = db('battery_rentals')
      .select(
        'battery_rentals.*',
        'users.full_name as user_name',
        'users.email as user_email',
        'batteries.serial_number as battery_serial',
        'batteries.battery_type',
        'pickup_stations.name as pickup_station_name',
        'return_stations.name as return_station_name'
      )
      .leftJoin('users', 'battery_rentals.user_id', 'users.id')
      .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
      .leftJoin('stations as pickup_stations', 'battery_rentals.pickup_station_id', 'pickup_stations.id')
      .leftJoin('stations as return_stations', 'battery_rentals.return_station_id', 'return_stations.id')
      .orderBy('battery_rentals.created_at', 'desc');

    // Filter by user if not admin
    if (req.user.role === 'customer') {
      query = query.where('battery_rentals.user_id', req.user.userId);
    } else if (user_id) {
      query = query.where('battery_rentals.user_id', user_id);
    }

    if (status) {
      query = query.where('battery_rentals.status', status);
    }

    const rentals = await query.limit(limit).offset(offset);
    const totalCount = await db('battery_rentals').count('id as count').first();

    res.json({
      rentals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Get rental by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rental = await db('battery_rentals')
      .select(
        'battery_rentals.*',
        'users.full_name as user_name',
        'users.email as user_email',
        'batteries.serial_number as battery_serial',
        'batteries.battery_type',
        'pickup_stations.name as pickup_station_name',
        'pickup_stations.location as pickup_station_location',
        'return_stations.name as return_station_name',
        'return_stations.location as return_station_location'
      )
      .leftJoin('users', 'battery_rentals.user_id', 'users.id')
      .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
      .leftJoin('stations as pickup_stations', 'battery_rentals.pickup_station_id', 'pickup_stations.id')
      .leftJoin('stations as return_stations', 'battery_rentals.return_station_id', 'return_stations.id')
      .where('battery_rentals.id', id)
      .first();

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Check ownership if customer
    if (req.user.role === 'customer' && rental.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ rental });

  } catch (error) {
    console.error('Get rental error:', error);
    res.status(500).json({ error: 'Failed to fetch rental' });
  }
});

// Create new rental (rent/swap battery)
router.post('/', async (req, res) => {
  try {
    const { battery_id, pickup_station_id } = req.body;

    if (!battery_id || !pickup_station_id) {
      return res.status(400).json({ error: 'Battery ID and pickup station ID are required' });
    }

    // Check if battery is available
    const battery = await db('batteries').where({ id: battery_id, status: 'available' }).first();
    if (!battery) {
      return res.status(404).json({ error: 'Battery not available' });
    }

    // Check if user has any active rentals
    const activeRental = await db('battery_rentals')
      .where({ user_id: req.user.userId, status: 'active' })
      .first();

    if (activeRental) {
      return res.status(400).json({ error: 'You already have an active rental' });
    }

    const trx = await db.transaction();

    try {
      // Create rental record
      const [rentalId] = await trx('battery_rentals').insert({
        user_id: req.user.userId,
        battery_id,
        pickup_station_id,
        rental_date: new Date(),
        status: 'active',
        hourly_rate: 50 // KES per hour
      });

      // Update battery status
      await trx('batteries').where({ id: battery_id }).update({
        status: 'rented',
        updated_at: new Date()
      });

      await trx.commit();

      // Get the created rental with details
      const rental = await db('battery_rentals')
        .select(
          'battery_rentals.*',
          'batteries.serial_number as battery_serial',
          'batteries.battery_type',
          'stations.name as pickup_station_name'
        )
        .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
        .leftJoin('stations', 'battery_rentals.pickup_station_id', 'stations.id')
        .where('battery_rentals.id', rentalId)
        .first();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('rental-created', rental);
      io.to(`station-${pickup_station_id}`).emit('battery-rented', { battery_id });

      res.status(201).json({
        message: 'Battery rented successfully',
        rental
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({ error: 'Failed to rent battery' });
  }
});

// Return battery
router.patch('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    const { return_station_id } = req.body;

    if (!return_station_id) {
      return res.status(400).json({ error: 'Return station ID is required' });
    }

    const rental = await db('battery_rentals').where({ id }).first();
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Check ownership if customer
    if (req.user.role === 'customer' && rental.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({ error: 'Rental is not active' });
    }

    const returnDate = new Date();
    const rentalHours = Math.ceil((returnDate - new Date(rental.rental_date)) / (1000 * 60 * 60));
    const totalCost = rentalHours * rental.hourly_rate;

    const trx = await db.transaction();

    try {
      // Update rental record
      await trx('battery_rentals').where({ id }).update({
        return_station_id,
        return_date: returnDate,
        total_cost: totalCost,
        status: 'completed',
        updated_at: new Date()
      });

      // Update battery status and location
      await trx('batteries').where({ id: rental.battery_id }).update({
        status: 'available',
        station_id: return_station_id,
        updated_at: new Date()
      });

      await trx.commit();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('rental-completed', { id, total_cost: totalCost });
      io.to(`station-${return_station_id}`).emit('battery-returned', { battery_id: rental.battery_id });

      res.json({
        message: 'Battery returned successfully',
        rental_hours: rentalHours,
        total_cost: totalCost
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Return battery error:', error);
    res.status(500).json({ error: 'Failed to return battery' });
  }
});

// Cancel rental
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const rental = await db('battery_rentals').where({ id }).first();
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Check ownership if customer
    if (req.user.role === 'customer' && rental.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({ error: 'Can only cancel active rentals' });
    }

    const trx = await db.transaction();

    try {
      // Update rental status
      await trx('battery_rentals').where({ id }).update({
        status: 'cancelled',
        updated_at: new Date()
      });

      // Update battery status
      await trx('batteries').where({ id: rental.battery_id }).update({
        status: 'available',
        updated_at: new Date()
      });

      await trx.commit();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('rental-cancelled', { id });

      res.json({ message: 'Rental cancelled successfully' });

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Cancel rental error:', error);
    res.status(500).json({ error: 'Failed to cancel rental' });
  }
});

// Get rental statistics
router.get('/stats/overview', requireAdminOrManager, async (req, res) => {
  try {
    const stats = await Promise.all([
      db('battery_rentals').count('id as count').first(),
      db('battery_rentals').where('status', 'active').count('id as count').first(),
      db('battery_rentals').where('status', 'completed').count('id as count').first(),
      db('battery_rentals').where('status', 'cancelled').count('id as count').first(),
      db('battery_rentals').where('status', 'completed').sum('total_cost as total').first(),
      db('battery_rentals').where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)).count('id as count').first()
    ]);

    res.json({
      totalRentals: stats[0].count,
      activeRentals: stats[1].count,
      completedRentals: stats[2].count,
      cancelledRentals: stats[3].count,
      totalRevenue: stats[4].total || 0,
      rentalsToday: stats[5].count
    });

  } catch (error) {
    console.error('Get rental stats error:', error);
    res.status(500).json({ error: 'Failed to fetch rental statistics' });
  }
});

module.exports = router;