const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin, requireAdminOrManager } = require('../middleware/auth');
const { batteryImageUpload, handleUploadError, cleanupOnError } = require('../middleware/fileUpload');

const router = express.Router();

// Get battery statistics
router.get('/stats', requireAdminOrManager, async (req, res) => {
  try {
    const total = await db('batteries').count('id as count').first();
    const available = await db('batteries').where('status', 'available').count('id as count').first();
    const rented = await db('batteries').where('status', 'rented').count('id as count').first();
    const maintenance = await db('batteries').where('status', 'maintenance').count('id as count').first();

    res.json({
      total: total.count,
      available: available.count,
      rented: rented.count,
      maintenance: maintenance.count
    });
  } catch (error) {
    console.error('Get battery stats error:', error);
    res.status(500).json({ error: 'Failed to fetch battery statistics' });
  }
});

// Get all batteries with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      station_id, 
      status = '',
      health_status = '',
      search = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    const offset = (page - 1) * limit;

    let query = db('batteries')
      .select(
        'batteries.*', 
        'stations.name as station_name', 
        'stations.address as station_address',
        'battery_rentals.id as current_rental_id',
        'users.full_name as renter_name'
      )
      .leftJoin('stations', 'batteries.current_station_id', 'stations.id')
      .leftJoin('battery_rentals', 'batteries.current_rental_id', 'battery_rentals.id')
      .leftJoin('users', 'battery_rentals.user_id', 'users.id')
      .orderBy(`batteries.${sort_by}`, sort_order);

    let countQuery = db('batteries').count('id as count').first();

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      const searchFilter = function() {
        this.where('batteries.battery_code', 'like', searchTerm)
            .orWhere('batteries.serial_number', 'like', searchTerm)
            .orWhere('batteries.model', 'like', searchTerm);
      };
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }

    if (station_id) {
      query = query.where('batteries.current_station_id', station_id);
      countQuery = countQuery.where('batteries.current_station_id', station_id);
    }

    if (status) {
      query = query.where('batteries.status', status);
      countQuery = countQuery.where('batteries.status', status);
    }

    if (health_status) {
      query = query.where('batteries.health_status', health_status);
      countQuery = countQuery.where('batteries.health_status', health_status);
    }

    const batteries = await query.limit(limit).offset(offset);
    const totalCount = await countQuery;

    res.json({
      batteries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get batteries error:', error);
    res.status(500).json({ error: 'Failed to fetch batteries' });
  }
});

// Get battery by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const battery = await db('batteries')
      .select('batteries.*', 'stations.name as station_name', 'stations.location as station_location')
      .leftJoin('stations', 'batteries.current_station_id', 'stations.id')
      .where('batteries.id', id)
      .first();

    if (!battery) {
      return res.status(404).json({ error: 'Battery not found' });
    }

    res.json({ battery });

  } catch (error) {
    console.error('Get battery error:', error);
    res.status(500).json({ error: 'Failed to fetch battery' });
  }
});

// The rest of the file remains the same...