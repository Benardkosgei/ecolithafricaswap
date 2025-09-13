const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin, requireAdminOrManager } = require('../middleware/auth');
const { batteryImageUpload, handleUploadError, cleanupOnError } = require('../middleware/fileUpload');

const router = express.Router();

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
      query = query.where('batteries.station_id', station_id);
      countQuery = countQuery.where('batteries.station_id', station_id);
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
      .leftJoin('stations', 'batteries.station_id', 'stations.id')
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

// Create new battery (admin only)
router.post('/', 
  requireAdmin,
  batteryImageUpload.single('image'),
  handleUploadError,
  cleanupOnError,
  [
    body('battery_code').notEmpty().withMessage('Battery code is required'),
    body('serial_number').notEmpty().withMessage('Serial number is required'),
    body('model').notEmpty().withMessage('Model is required'),
    body('capacity_kwh').isFloat({ min: 0.1 }).withMessage('Capacity must be a positive number')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      battery_code,
      serial_number,
      model,
      manufacturer,
      capacity_kwh,
      current_station_id,
      manufacture_date,
      notes
    } = req.body;

    // Check if battery code already exists
    const existingCode = await db('batteries').where({ battery_code }).first();
    if (existingCode) {
      return res.status(409).json({ error: 'Battery with this code already exists' });
    }

    // Check if serial number already exists
    const existingSerial = await db('batteries').where({ serial_number }).first();
    if (existingSerial) {
      return res.status(409).json({ error: 'Battery with this serial number already exists' });
    }

    // Verify station exists if provided
    if (current_station_id) {
      const station = await db('stations').where({ id: current_station_id }).first();
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }
    }

    const batteryData = {
      battery_code,
      serial_number,
      model,
      manufacturer,
      capacity_kwh: parseFloat(capacity_kwh),
      current_charge_percentage: 100,
      status: 'available',
      health_status: 'excellent',
      cycle_count: 0,
      current_station_id: current_station_id || null,
      manufacture_date: manufacture_date || null,
      notes
    };

    if (req.file) {
      batteryData.image_url = `/uploads/batteries/${req.file.filename}`;
    }

    const [batteryId] = await db('batteries').insert(batteryData);

    const battery = await db('batteries').where({ id: batteryId }).first();

    res.status(201).json({
      message: 'Battery created successfully',
      battery
    });

  } catch (error) {
    console.error('Create battery error:', error);
    res.status(500).json({ error: 'Failed to create battery' });
  }
});

// Update battery
router.put('/:id', 
  requireAdminOrManager,
  batteryImageUpload.single('image'),
  handleUploadError,
  cleanupOnError,
  [
    body('capacity_kwh').optional().isFloat({ min: 0.1 }).withMessage('Capacity must be a positive number'),
    body('current_charge_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Charge percentage must be between 0-100')
  ],
  async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      model,
      manufacturer,
      capacity_kwh,
      current_station_id,
      status,
      current_charge_percentage,
      health_status,
      cycle_count,
      notes,
      last_maintenance_date,
      next_maintenance_due
    } = req.body;

    const battery = await db('batteries').where({ id }).first();
    if (!battery) {
      return res.status(404).json({ error: 'Battery not found' });
    }

    const updateData = {
      updated_at: new Date()
    };

    if (model) updateData.model = model;
    if (manufacturer) updateData.manufacturer = manufacturer;
    if (capacity_kwh) updateData.capacity_kwh = parseFloat(capacity_kwh);
    if (current_station_id !== undefined) updateData.current_station_id = current_station_id;
    if (status) updateData.status = status;
    if (current_charge_percentage !== undefined) updateData.current_charge_percentage = parseFloat(current_charge_percentage);
    if (health_status) updateData.health_status = health_status;
    if (cycle_count !== undefined) updateData.cycle_count = parseInt(cycle_count);
    if (notes !== undefined) updateData.notes = notes;
    if (last_maintenance_date) updateData.last_maintenance_date = last_maintenance_date;
    if (next_maintenance_due) updateData.next_maintenance_due = next_maintenance_due;

    if (req.file) {
      updateData.image_url = `/uploads/batteries/${req.file.filename}`;
    }

    await db('batteries').where({ id }).update(updateData);

    res.json({ message: 'Battery updated successfully' });

  } catch (error) {
    console.error('Update battery error:', error);
    res.status(500).json({ error: 'Failed to update battery' });
  }
});

// Delete battery (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const battery = await db('batteries').where({ id }).first();
    if (!battery) {
      return res.status(404).json({ error: 'Battery not found' });
    }

    await db('batteries').where({ id }).del();

    res.json({ message: 'Battery deleted successfully' });

  } catch (error) {
    console.error('Delete battery error:', error);
    res.status(500).json({ error: 'Failed to delete battery' });
  }
});

// Get battery statistics
router.get('/stats/overview', requireAdminOrManager, async (req, res) => {
  try {
    const stats = await db('batteries')
      .select('status')
      .count('id as count')
      .groupBy('status');

    const formattedStats = stats.map(stat => {
        let color = '#000000'; // Default color
        switch(stat.status) {
            case 'available': color = '#4CAF50'; break;
            case 'rented': color = '#FFC107'; break;
            case 'charging': color = '#2196F3'; break;
            case 'maintenance': color = '#f44336'; break;
        }
        return {
            name: stat.status.charAt(0).toUpperCase() + stat.status.slice(1),
            value: stat.count,
            color: color
        };
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('Get battery stats error:', error);
    res.status(500).json({ error: 'Failed to fetch battery statistics' });
  }
});

// Update battery charge level
router.patch('/:id/charge', requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { charge_level } = req.body;

    if (charge_level < 0 || charge_level > 100) {
      return res.status(400).json({ error: 'Charge level must be between 0 and 100' });
    }

    await db('batteries').where({ id }).update({
      charge_level,
      updated_at: new Date()
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('battery-updated', { id, charge_level });

    res.json({ message: 'Battery charge level updated successfully' });

  } catch (error) {
    console.error('Update battery charge error:', error);
    res.status(500).json({ error: 'Failed to update battery charge level' });
  }
});

// Bulk update batteries status
router.patch('/bulk/update', requireAdmin, async (req, res) => {
  try {
    const { battery_ids, update_data } = req.body;

    if (!battery_ids || !Array.isArray(battery_ids) || battery_ids.length === 0) {
      return res.status(400).json({ error: 'Battery IDs array is required' });
    }

    if (!update_data || typeof update_data !== 'object') {
      return res.status(400).json({ error: 'Update data is required' });
    }

    const allowedFields = ['status', 'health_status', 'current_station_id', 'notes'];
    const filteredUpdateData = {};
    
    Object.keys(update_data).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = update_data[key];
      }
    });

    if (Object.keys(filteredUpdateData).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    filteredUpdateData.updated_at = new Date();

    const updatedCount = await db('batteries')
      .whereIn('id', battery_ids)
      .update(filteredUpdateData);

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('batteries-bulk-updated', { battery_ids, update_data: filteredUpdateData });

    res.json({ 
      message: `${updatedCount} batteries updated successfully`,
      updated_count: updatedCount
    });

  } catch (error) {
    console.error('Bulk update batteries error:', error);
    res.status(500).json({ error: 'Failed to bulk update batteries' });
  }
});

// Get batteries needing maintenance
router.get('/maintenance/needed', requireAdminOrManager, async (req, res) => {
  try {
    const batteriesNeedingMaintenance = await db('batteries')
      .select(
        'batteries.*',
        'stations.name as station_name'
      )
      .leftJoin('stations', 'batteries.current_station_id', 'stations.id')
      .where(function() {
        this.where('batteries.health_status', 'poor')
            .orWhere('batteries.next_maintenance_due', '<=', new Date())
            .orWhere('batteries.cycle_count', '>', 200);
      })
      .orderBy('batteries.next_maintenance_due', 'asc');

    res.json({ batteries: batteriesNeedingMaintenance });

  } catch (error) {
    console.error('Get maintenance needed error:', error);
    res.status(500).json({ error: 'Failed to fetch batteries needing maintenance' });
  }
});

// Battery performance analytics
router.get('/analytics/performance', requireAdminOrManager, async (req, res) => {
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

    const analytics = await Promise.all([
      // Battery utilization by status
      db('batteries')
        .select('status')
        .count('id as count')
        .groupBy('status'),
      
      // Battery health distribution
      db('batteries')
        .select('health_status')
        .count('id as count')
        .avg('cycle_count as avg_cycles')
        .groupBy('health_status'),
      
      // Most rented batteries
      db('battery_rentals')
        .select(
          'batteries.battery_code',
          'batteries.model',
          db.raw('COUNT(battery_rentals.id) as rental_count')
        )
        .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
        .where('battery_rentals.created_at', '>=', startDate)
        .groupBy('batteries.id', 'batteries.battery_code', 'batteries.model')
        .orderBy('rental_count', 'desc')
        .limit(10),
      
      // Station battery distribution
      db('batteries')
        .select(
          'stations.name as station_name',
          db.raw('COUNT(batteries.id) as battery_count')
        )
        .leftJoin('stations', 'batteries.current_station_id', 'stations.id')
        .where('batteries.status', 'available')
        .groupBy('stations.id', 'stations.name')
        .orderBy('battery_count', 'desc')
    ]);

    res.json({
      period,
      statusDistribution: analytics[0],
      healthDistribution: analytics[1],
      mostRentedBatteries: analytics[2],
      stationDistribution: analytics[3]
    });

  } catch (error) {
    console.error('Get battery analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch battery analytics' });
  }
});

// Export batteries data
router.get('/export/csv', requireAdminOrManager, async (req, res) => {
  try {
    const { status, health_status } = req.query;

    let query = db('batteries')
      .select(
        'batteries.battery_code',
        'batteries.serial_number',
        'batteries.model',
        'batteries.manufacturer',
        'batteries.capacity_kwh',
        'batteries.status',
        'batteries.health_status',
        'batteries.current_charge_percentage',
        'batteries.cycle_count',
        'batteries.created_at',
        'stations.name as station_name'
      )
      .leftJoin('stations', 'batteries.current_station_id', 'stations.id')
      .orderBy('batteries.created_at', 'desc');

    if (status) {
      query = query.where('batteries.status', status);
    }
    if (health_status) {
      query = query.where('batteries.health_status', health_status);
    }

    const batteries = await query;

    // Convert to CSV format
    const headers = [
      'Battery Code', 'Serial Number', 'Model', 'Manufacturer', 'Capacity (kWh)', 
      'Status', 'Health Status', 'Charge %', 'Cycle Count', 'Current Station', 'Created At'
    ];
    const csvData = [headers];
    
    batteries.forEach(battery => {
      csvData.push([
        battery.battery_code,
        battery.serial_number,
        battery.model,
        battery.manufacturer,
        battery.capacity_kwh,
        battery.status,
        battery.health_status,
        battery.current_charge_percentage,
        battery.cycle_count,
        battery.station_name || 'Not Assigned',
        battery.created_at
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=batteries_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export batteries error:', error);
    res.status(500).json({ error: 'Failed to export batteries data' });
  }
});

module.exports = router;