const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get all batteries with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      station_id = '',
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
        'stations.name as station_name'
      )
      .leftJoin('stations', 'batteries.current_station_id', 'stations.id')
      .orderBy(`batteries.${sort_by}`, sort_order);

    // Filters
    if (search) {
      query = query.where(function() {
        this.where('batteries.serial_number', 'like', `%${search}%`)
            .orWhere('batteries.model', 'like', `%${search}%`);
      });
    }

    if (station_id) {
      query = query.where('batteries.current_station_id', station_id);
    }

    if (status && status !== 'all') {
      query = query.where('batteries.status', status);
    }

    if (health_status && health_status !== 'all') {
      query = query.where('batteries.health_status', health_status);
    }

    const batteries = await query.limit(parseInt(limit)).offset(offset);
    
    // Get total count
    let countQuery = db('batteries');
    if (search) {
      countQuery = countQuery.where(function() {
        this.where('serial_number', 'like', `%${search}%`)
            .orWhere('model', 'like', `%${search}%`);
      });
    }
    if (station_id) countQuery = countQuery.where('current_station_id', station_id);
    if (status && status !== 'all') countQuery = countQuery.where('status', status);
    if (health_status && health_status !== 'all') countQuery = countQuery.where('health_status', health_status);
    
    const totalCount = await countQuery.count('id as count').first();

    res.json({
      data: batteries,
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
      .select(
        'batteries.*',
        'stations.name as station_name'
      )
      .leftJoin('stations', 'batteries.current_station_id', 'stations.id')
      .where('batteries.id', id)
      .first();

    if (!battery) {
      return res.status(404).json({ error: 'Battery not found' });
    }

    res.json({ data: battery });

  } catch (error) {
    console.error('Get battery error:', error);
    res.status(500).json({ error: 'Failed to fetch battery' });
  }
});

// Get battery statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalBatteries = await db('batteries').count('id as count').first();
    const availableBatteries = await db('batteries').where('status', 'available').count('id as count').first();
    const rentedBatteries = await db('batteries').where('status', 'rented').count('id as count').first();
    const chargingBatteries = await db('batteries').where('status', 'charging').count('id as count').first();
    const maintenanceBatteries = await db('batteries').where('status', 'maintenance').count('id as count').first();
    const excellentHealth = await db('batteries').where('health_status', 'excellent').count('id as count').first();
    const goodHealth = await db('batteries').where('health_status', 'good').count('id as count').first();
    const fairHealth = await db('batteries').where('health_status', 'fair').count('id as count').first();

    res.json({
      data: {
        totalBatteries: totalBatteries.count,
        availableBatteries: availableBatteries.count,
        rentedBatteries: rentedBatteries.count,
        chargingBatteries: chargingBatteries.count,
        maintenanceBatteries: maintenanceBatteries.count,
        excellentHealth: excellentHealth.count,
        goodHealth: goodHealth.count,
        fairHealth: fairHealth.count
      }
    });

  } catch (error) {
    console.error('Get battery stats error:', error);
    res.status(500).json({ error: 'Failed to fetch battery statistics' });
  }
});

// Create battery
router.post('/', async (req, res) => {
  try {
    const {
      serial_number,
      model,
      manufacturer = 'EcoLith',
      capacity_kwh,
      current_station_id,
      status = 'available',
      health_status = 'excellent'
    } = req.body;

    const [batteryId] = await db('batteries').insert({
      serial_number,
      model,
      manufacturer,
      capacity_kwh,
      current_station_id,
      status,
      health_status,
      current_charge_percentage: 100,
      cycle_count: 0
    });

    res.status(201).json({ 
      data: { 
        id: batteryId,
        message: 'Battery created successfully' 
      }
    });

  } catch (error) {
    console.error('Create battery error:', error);
    res.status(500).json({ error: 'Failed to create battery' });
  }
});

// Update battery
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await db('batteries')
      .where('id', id)
      .update({
        ...updateData,
        updated_at: new Date()
      });

    if (!updated) {
      return res.status(404).json({ error: 'Battery not found' });
    }

    res.json({ 
      data: { 
        message: 'Battery updated successfully' 
      }
    });

  } catch (error) {
    console.error('Update battery error:', error);
    res.status(500).json({ error: 'Failed to update battery' });
  }
});

// Delete battery
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await db('batteries')
      .where('id', id)
      .del();

    if (!deleted) {
      return res.status(404).json({ error: 'Battery not found' });
    }

    res.json({ 
      data: { 
        message: 'Battery deleted successfully' 
      }
    });

  } catch (error) {
    console.error('Delete battery error:', error);
    res.status(500).json({ error: 'Failed to delete battery' });
  }
});

// Update charge level
router.patch('/:id/charge', async (req, res) => {
  try {
    const { id } = req.params;
    const { charge_level } = req.body;

    const updated = await db('batteries')
      .where('id', id)
      .update({ 
        current_charge_percentage: charge_level,
        updated_at: new Date()
      });

    if (!updated) {
      return res.status(404).json({ error: 'Battery not found' });
    }

    res.json({ 
      data: { 
        message: 'Charge level updated successfully' 
      }
    });

  } catch (error) {
    console.error('Update charge level error:', error);
    res.status(500).json({ error: 'Failed to update charge level' });
  }
});

// Bulk update batteries
router.patch('/bulk/update', async (req, res) => {
  try {
    const { battery_ids, update_data } = req.body;

    const updated = await db('batteries')
      .whereIn('id', battery_ids)
      .update({
        ...update_data,
        updated_at: new Date()
      });

    res.json({ 
      data: { 
        updated_count: updated,
        message: `${updated} batteries updated successfully`
      }
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update batteries' });
  }
});

// Get batteries needing maintenance
router.get('/maintenance/needed', async (req, res) => {
  try {
    const batteries = await db('batteries')
      .select(
        'batteries.*',
        'stations.name as station_name'
      )
      .leftJoin('stations', 'batteries.current_station_id', 'stations.id')
      .where('batteries.health_status', 'fair')
      .orWhere('batteries.health_status', 'poor')
      .orWhere('batteries.cycle_count', '>', 1000)
      .limit(20);

    res.json({ data: batteries });

  } catch (error) {
    console.error('Get maintenance needed error:', error);
    res.status(500).json({ error: 'Failed to fetch batteries needing maintenance' });
  }
});

// Get battery analytics
router.get('/analytics/performance', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Simplified analytics for demo
    const analytics = {
      averageChargeLevel: 85.5,
      averageHealthPercentage: 92.3,
      totalCycles: 15640,
      maintenanceAlerts: 3,
      performanceTrend: 'stable'
    };

    res.json({ data: analytics });

  } catch (error) {
    console.error('Get battery analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch battery analytics' });
  }
});

// Export batteries data
router.get('/export/csv', async (req, res) => {
  try {
    const batteries = await db('batteries')
      .select(
        'batteries.*',
        'stations.name as station_name'
      )
      .leftJoin('stations', 'batteries.current_station_id', 'stations.id');

    // Simple CSV generation
    let csv = 'ID,Serial Number,Model,Capacity (kWh),Charge %,Status,Health,Station\n';
    batteries.forEach(battery => {
      csv += `${battery.id},${battery.serial_number},${battery.model},${battery.capacity_kwh},${battery.current_charge_percentage},${battery.status},${battery.health_status},${battery.station_name || 'None'}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=batteries.csv');
    res.send(csv);

  } catch (error) {
    console.error('Export batteries error:', error);
    res.status(500).json({ error: 'Failed to export batteries data' });
  }
});

module.exports = router;
