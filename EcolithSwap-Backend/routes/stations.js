const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin, requireAdminOrManager } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/stations/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all stations with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      search = '', 
      station_type = '',
      is_active = '',
      accepts_plastic = '',
      maintenance_mode = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    
    const offset = (page - 1) * limit;

    let query = db('stations')
      .select(
        'stations.*',
        'users.full_name as manager_name',
        'users.email as manager_email',
        db.raw('COUNT(DISTINCT batteries.id) as battery_count')
      )
      .leftJoin('users', 'stations.manager_id', 'users.id')
      .leftJoin('batteries', 'stations.id', 'batteries.current_station_id')
      .groupBy('stations.id')
      .orderBy(`stations.${sort_by}`, sort_order);

    // Search filter
    if (search) {
      query = query.where(function() {
        this.where('stations.name', 'like', `%${search}%`)
            .orWhere('stations.address', 'like', `%${search}%`)
            .orWhere('users.full_name', 'like', `%${search}%`);
      });
    }

    // Type filter
    if (station_type) {
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

    const stations = await query.limit(limit).offset(offset);
    
    // Get total count for pagination
    let countQuery = db('stations');
    if (search) {
      countQuery = countQuery.where(function() {
        this.where('name', 'like', `%${search}%`)
            .orWhere('address', 'like', `%${search}%`);
      });
    }
    if (station_type) countQuery = countQuery.where('station_type', station_type);
    if (is_active !== '') countQuery = countQuery.where('is_active', is_active === 'true');
    
    const totalCount = await countQuery.count('id as count').first();

    res.json({
      data: stations,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get stations error:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

// Get station by ID with detailed information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const station = await db('stations')
      .select(
        'stations.*',
        'users.full_name as manager_name',
        'users.email as manager_email',
        'users.phone as manager_phone'
      )
      .leftJoin('users', 'stations.manager_id', 'users.id')
      .where('stations.id', id)
      .first();

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Get batteries at this station
    const batteries = await db('batteries')
      .select('id', 'battery_code', 'serial_number', 'status', 'current_charge_percentage', 'health_status')
      .where('current_station_id', id);

    // Get recent rentals from this station
    const recentRentals = await db('battery_rentals')
      .select(
        'battery_rentals.id',
        'battery_rentals.start_time',
        'battery_rentals.status',
        'users.full_name as user_name',
        'batteries.battery_code'
      )
      .leftJoin('users', 'battery_rentals.user_id', 'users.id')
      .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
      .where('battery_rentals.pickup_station_id', id)
      .orderBy('battery_rentals.created_at', 'desc')
      .limit(10);

    res.json({ 
      station: {
        ...station,
        batteries,
        recentRentals
      }
    });

  } catch (error) {
    console.error('Get station error:', error);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
});

// Create new station
router.post('/', 
  requireAdmin,
  upload.single('image'),
  [
    body('name').notEmpty().withMessage('Station name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('station_type').isIn(['swap', 'charge', 'both']).withMessage('Invalid station type'),
    body('total_slots').isInt({ min: 1 }).withMessage('Total slots must be a positive integer')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        address,
        latitude,
        longitude,
        station_type,
        total_slots,
        operating_hours,
        contact_info,
        manager_id,
        accepts_plastic = true,
        self_service = false
      } = req.body;

      const stationData = {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        station_type,
        total_slots: parseInt(total_slots),
        available_batteries: 0,
        operating_hours,
        contact_info,
        manager_id: manager_id || null,
        accepts_plastic,
        self_service,
        is_active: true,
        maintenance_mode: false
      };

      if (req.file) {
        stationData.image_url = `/uploads/stations/${req.file.filename}`;
      }

      const [stationId] = await db('stations').insert(stationData);
      const station = await db('stations').where({ id: stationId }).first();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('station-created', station);

      res.status(201).json({
        message: 'Station created successfully',
        station
      });

    } catch (error) {
      console.error('Create station error:', error);
      res.status(500).json({ error: 'Failed to create station' });
    }
  }
);

// Update station
router.put('/:id', 
  requireAdminOrManager,
  upload.single('image'),
  [
    body('name').optional().notEmpty().withMessage('Station name cannot be empty'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('station_type').optional().isIn(['swap', 'charge', 'both']).withMessage('Invalid station type'),
    body('total_slots').optional().isInt({ min: 1 }).withMessage('Total slots must be a positive integer')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const station = await db('stations').where({ id }).first();
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      const updateData = { ...req.body, updated_at: new Date() };
      
      // Convert string booleans to actual booleans
      ['is_active', 'accepts_plastic', 'self_service', 'maintenance_mode'].forEach(field => {
        if (updateData[field] !== undefined) {
          updateData[field] = updateData[field] === 'true' || updateData[field] === true;
        }
      });

      if (req.file) {
        updateData.image_url = `/uploads/stations/${req.file.filename}`;
      }

      await db('stations').where({ id }).update(updateData);

      const updatedStation = await db('stations').where({ id }).first();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('station-updated', updatedStation);
      io.to(`station-${id}`).emit('station-info-updated', updatedStation);

      res.json({ 
        message: 'Station updated successfully',
        station: updatedStation
      });

    } catch (error) {
      console.error('Update station error:', error);
      res.status(500).json({ error: 'Failed to update station' });
    }
  }
);

// Toggle station maintenance mode
router.patch('/:id/maintenance', requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { maintenance_mode, maintenance_notes } = req.body;

    const station = await db('stations').where({ id }).first();
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    await db('stations').where({ id }).update({
      maintenance_mode,
      maintenance_notes,
      updated_at: new Date()
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('station-maintenance-updated', { id, maintenance_mode });
    io.to(`station-${id}`).emit('maintenance-status-changed', { maintenance_mode });

    res.json({ 
      message: `Station maintenance mode ${maintenance_mode ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Update maintenance mode error:', error);
    res.status(500).json({ error: 'Failed to update maintenance mode' });
  }
});

// Bulk update stations
router.patch('/bulk/update', requireAdmin, async (req, res) => {
  try {
    const { station_ids, update_data } = req.body;

    if (!station_ids || !Array.isArray(station_ids) || station_ids.length === 0) {
      return res.status(400).json({ error: 'Station IDs array is required' });
    }

    if (!update_data || typeof update_data !== 'object') {
      return res.status(400).json({ error: 'Update data is required' });
    }

    const allowedFields = ['is_active', 'maintenance_mode', 'accepts_plastic', 'manager_id'];
    const filteredUpdateData = {};
    
    Object.keys(update_data).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = update_data[key];
      }
    });

    filteredUpdateData.updated_at = new Date();

    const updatedCount = await db('stations')
      .whereIn('id', station_ids)
      .update(filteredUpdateData);

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('stations-bulk-updated', { station_ids, update_data: filteredUpdateData });

    res.json({ 
      message: `${updatedCount} stations updated successfully`,
      updated_count: updatedCount
    });

  } catch (error) {
    console.error('Bulk update stations error:', error);
    res.status(500).json({ error: 'Failed to bulk update stations' });
  }
});

// Delete station
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const station = await db('stations').where({ id }).first();
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check if station has active rentals
    const activeRentals = await db('battery_rentals')
      .where('pickup_station_id', id)
      .where('status', 'active')
      .count('id as count')
      .first();

    if (activeRentals.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete station with active rentals. Please complete or cancel all active rentals first.' 
      });
    }

    // Update batteries to remove station reference
    await db('batteries').where('current_station_id', id).update({ current_station_id: null });

    // Delete the station
    await db('stations').where({ id }).del();

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('station-deleted', { id });

    res.json({ message: 'Station deleted successfully' });

  } catch (error) {
    console.error('Delete station error:', error);
    res.status(500).json({ error: 'Failed to delete station' });
  }
});

// Get station statistics
router.get('/stats', requireAdminOrManager, async (req, res) => {
  try {
    const stats = await Promise.all([
      db('stations').count('id as count').first(),
      db('stations').where('is_active', true).count('id as count').first(),
      db('stations').where('maintenance_mode', true).count('id as count').first(),
      db('stations').where('station_type', 'swap').count('id as count').first(),
      db('stations').where('station_type', 'charge').count('id as count').first(),
      db('stations').where('station_type', 'both').count('id as count').first(),
      db('stations').where('accepts_plastic', true).count('id as count').first()
    ]);

    res.json({
      totalStations: stats[0].count,
      activeStations: stats[1].count,
      maintenanceStations: stats[2].count,
      swapStations: stats[3].count,
      chargeStations: stats[4].count,
      bothTypeStations: stats[5].count,
      plasticAcceptingStations: stats[6].count
    });

  } catch (error) {
    console.error('Get station stats error:', error);
    res.status(500).json({ error: 'Failed to fetch station statistics' });
  }
});

// Get station statistics
router.get('/stats/overview', requireAdminOrManager, async (req, res) => {
  try {
    const stats = await Promise.all([
      db('stations').count('id as count').first(),
      db('stations').where('is_active', true).count('id as count').first(),
      db('stations').where('maintenance_mode', true).count('id as count').first(),
      db('stations').where('station_type', 'swap').count('id as count').first(),
      db('stations').where('station_type', 'charge').count('id as count').first(),
      db('stations').where('station_type', 'both').count('id as count').first(),
      db('stations').where('accepts_plastic', true).count('id as count').first()
    ]);

    res.json({
      totalStations: stats[0].count,
      activeStations: stats[1].count,
      maintenanceStations: stats[2].count,
      swapStations: stats[3].count,
      chargeStations: stats[4].count,
      bothTypeStations: stats[5].count,
      plasticAcceptingStations: stats[6].count
    });

  } catch (error) {
    console.error('Get station stats error:', error);
    res.status(500).json({ error: 'Failed to fetch station statistics' });
  }
});

// Get stations by location (for mobile app)
router.get('/nearby/:latitude/:longitude', async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const { radius = 10 } = req.query; // radius in km

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const stations = await db('stations')
      .select(
        'stations.*',
        db.raw(`(
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude))
          )
        ) AS distance`, [lat, lng, lat])
      )
      .where('is_active', true)
      .where('maintenance_mode', false)
      .having('distance', '<=', radius)
      .orderBy('distance', 'asc');

    res.json({ stations });

  } catch (error) {
    console.error('Get nearby stations error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby stations' });
  }
});

router.post('/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/stations/${req.file.filename}`;

    res.status(201).json({ 
      message: 'File uploaded successfully', 
      url: fileUrl
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

module.exports = router;
