const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get all stations with filtering (simplified)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      station_type = '',
      is_active = '',
      accepts_plastic = '',
      maintenance_mode = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = db('stations')
      .select(
        'stations.*',
        db.raw('COUNT(DISTINCT batteries.id) as battery_count')
      )
      .leftJoin('batteries', 'stations.id', 'batteries.current_station_id')
      .groupBy('stations.id')
      .orderBy(`stations.${sort_by}`, sort_order);

    // Search filter
    if (search) {
      query = query.where(function() {
        this.where('stations.name', 'like', `%${search}%`)
            .orWhere('stations.address', 'like', `%${search}%`);
      });
    }

    // Type filter
    if (station_type && station_type !== 'all') {
      query = query.where('stations.station_type', station_type);
    }

    // Status filters
    if (is_active !== '') {
      query = query.where('stations.is_active', is_active === 'true');
    }

    if (accepts_plastic !== '') {
      query = query.where('stations.accepts_plastic', accepts_plastic === 'true');
    }

    if (maintenance_mode !== '') {
      query = query.where('stations.maintenance_mode', maintenance_mode === 'true');
    }

    const stations = await query.limit(parseInt(limit)).offset(offset);
    
    // Get total count for pagination
    let countQuery = db('stations');
    if (search) {
      countQuery = countQuery.where(function() {
        this.where('name', 'like', `%${search}%`)
            .orWhere('address', 'like', `%${search}%`);
      });
    }
    if (station_type && station_type !== 'all') countQuery = countQuery.where('station_type', station_type);
    if (is_active !== '') countQuery = countQuery.where('is_active', is_active === 'true');
    if (accepts_plastic !== '') countQuery = countQuery.where('accepts_plastic', accepts_plastic === 'true');
    if (maintenance_mode !== '') countQuery = countQuery.where('maintenance_mode', maintenance_mode === 'true');
    
    const totalCount = await countQuery.count('id as count').first();

    res.json({
      data: stations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get stations error:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

// Get station by ID (simplified)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const station = await db('stations')
      .where('id', id)
      .first();

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Get batteries at this station
    const batteries = await db('batteries')
      .select('id', 'serial_number', 'status', 'current_charge_percentage', 'health_status')
      .where('current_station_id', id);

    res.json({ 
      data: {
        ...station,
        batteries
      }
    });

  } catch (error) {
    console.error('Get station error:', error);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
});

// Get station statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalStations = await db('stations').count('id as count').first();
    const activeStations = await db('stations').where('is_active', true).count('id as count').first();
    const maintenanceStations = await db('stations').where('maintenance_mode', true).count('id as count').first();
    const swapStations = await db('stations').where('station_type', 'swap').count('id as count').first();
    const chargeStations = await db('stations').where('station_type', 'charge').count('id as count').first();
    const bothTypeStations = await db('stations').where('station_type', 'both').count('id as count').first();
    const plasticAcceptingStations = await db('stations').where('accepts_plastic', true).count('id as count').first();

    res.json({
      data: {
        totalStations: totalStations.count,
        activeStations: activeStations.count,
        maintenanceStations: maintenanceStations.count,
        swapStations: swapStations.count,
        chargeStations: chargeStations.count,
        bothTypeStations: bothTypeStations.count,
        plasticAcceptingStations: plasticAcceptingStations.count
      }
    });

  } catch (error) {
    console.error('Get station stats error:', error);
    res.status(500).json({ error: 'Failed to fetch station statistics' });
  }
});

// Create station (simplified)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      station_type,
      total_slots,
      operating_hours,
      contact_info,
      accepts_plastic = true,
      self_service = false
    } = req.body;

    const [stationId] = await db('stations').insert({
      name,
      address,
      latitude,
      longitude,
      station_type,
      total_slots,
      operating_hours,
      contact_info,
      accepts_plastic,
      self_service,
      is_active: true,
      maintenance_mode: false
    });

    res.status(201).json({ 
      data: { 
        id: stationId,
        message: 'Station created successfully' 
      }
    });

  } catch (error) {
    console.error('Create station error:', error);
    res.status(500).json({ error: 'Failed to create station' });
  }
});

// Update station (simplified)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await db('stations')
      .where('id', id)
      .update(updateData);

    if (!updated) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json({ 
      data: { 
        message: 'Station updated successfully' 
      }
    });

  } catch (error) {
    console.error('Update station error:', error);
    res.status(500).json({ error: 'Failed to update station' });
  }
});

// Delete station
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await db('stations')
      .where('id', id)
      .del();

    if (!deleted) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json({ 
      data: { 
        message: 'Station deleted successfully' 
      }
    });

  } catch (error) {
    console.error('Delete station error:', error);
    res.status(500).json({ error: 'Failed to delete station' });
  }
});

// Toggle maintenance mode
router.patch('/:id/maintenance', async (req, res) => {
  try {
    const { id } = req.params;
    const { maintenance_mode, maintenance_notes } = req.body;

    const updated = await db('stations')
      .where('id', id)
      .update({ 
        maintenance_mode,
        updated_at: new Date()
      });

    if (!updated) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json({ 
      data: { 
        message: 'Maintenance mode updated successfully' 
      }
    });

  } catch (error) {
    console.error('Toggle maintenance error:', error);
    res.status(500).json({ error: 'Failed to update maintenance mode' });
  }
});

// Bulk update stations
router.patch('/bulk/update', async (req, res) => {
  try {
    const { station_ids, update_data } = req.body;

    const updated = await db('stations')
      .whereIn('id', station_ids)
      .update({
        ...update_data,
        updated_at: new Date()
      });

    res.json({ 
      data: { 
        updated_count: updated,
        message: `${updated} stations updated successfully`
      }
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update stations' });
  }
});

// Get nearby stations
router.get('/nearby/:latitude/:longitude', async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const { radius = 10 } = req.query; // Default 10km radius

    // Simple distance calculation (for demo purposes)
    const stations = await db('stations')
      .select('*')
      .where('is_active', true)
      .limit(10);

    res.json({ 
      data: stations
    });

  } catch (error) {
    console.error('Get nearby stations error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby stations' });
  }
});

module.exports = router;
