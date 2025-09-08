const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin, requireAdminOrManager } = require('../middleware/auth');
const { wasteImageUpload, handleUploadError, cleanupOnError } = require('../middleware/fileUpload');

const router = express.Router();

// Get all plastic waste logs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, user_id, waste_type } = req.query;
    const offset = (page - 1) * limit;

    let query = db('plastic_waste_logs')
      .select(
        'plastic_waste_logs.*',
        'users.full_name as user_name',
        'users.email as user_email',
        'stations.name as station_name',
        'stations.location as station_location'
      )
      .leftJoin('users', 'plastic_waste_logs.user_id', 'users.id')
      .leftJoin('stations', 'plastic_waste_logs.station_id', 'stations.id')
      .orderBy('plastic_waste_logs.created_at', 'desc');

    // Filter by user if not admin
    if (req.user.role === 'customer') {
      query = query.where('plastic_waste_logs.user_id', req.user.userId);
    } else if (user_id) {
      query = query.where('plastic_waste_logs.user_id', user_id);
    }

    if (waste_type) {
      query = query.where('plastic_waste_logs.waste_type', waste_type);
    }

    const wasteLogs = await query.limit(limit).offset(offset);
    const totalCount = await db('plastic_waste_logs').count('id as count').first();

    res.json({
      wasteLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get waste logs error:', error);
    res.status(500).json({ error: 'Failed to fetch waste logs' });
  }
});

// Get waste log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const wasteLog = await db('plastic_waste_logs')
      .select(
        'plastic_waste_logs.*',
        'users.full_name as user_name',
        'users.email as user_email',
        'stations.name as station_name',
        'stations.location as station_location'
      )
      .leftJoin('users', 'plastic_waste_logs.user_id', 'users.id')
      .leftJoin('stations', 'plastic_waste_logs.station_id', 'stations.id')
      .where('plastic_waste_logs.id', id)
      .first();

    if (!wasteLog) {
      return res.status(404).json({ error: 'Waste log not found' });
    }

    // Check ownership if customer
    if (req.user.role === 'customer' && wasteLog.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ wasteLog });

  } catch (error) {
    console.error('Get waste log error:', error);
    res.status(500).json({ error: 'Failed to fetch waste log' });
  }
});

// Log plastic waste submission with photos
router.post('/', 
  wasteImageUpload.array('photos', 5),
  handleUploadError,
  cleanupOnError,
  [
    body('plastic_type').isIn(['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'OTHER']).withMessage('Invalid plastic type'),
    body('weight_kg').isFloat({ min: 0.001 }).withMessage('Weight must be a positive number'),
    body('station_id').notEmpty().withMessage('Station ID is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plastic_type, weight_kg, station_id, description } = req.body;

    // Verify station exists and accepts plastic
    const station = await db('stations').where({ id: station_id }).first();
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    if (!station.accepts_plastic) {
      return res.status(400).json({ error: 'This station does not accept plastic waste' });
    }

    // Calculate points based on plastic type and weight
    const pointRates = {
      'PET': 15, // Points per kg
      'HDPE': 12,
      'PVC': 8,
      'LDPE': 10,
      'PP': 11,
      'PS': 7,
      'OTHER': 5
    };

    const pointsPerKg = pointRates[plastic_type] || pointRates['OTHER'];
    const pointsEarned = Math.round(parseFloat(weight_kg) * pointsPerKg);
    
    // Calculate estimated CO2 saved (kg CO2 per kg plastic)
    const co2SavedPerKg = 1.8; // Average CO2 saved per kg of recycled plastic
    const co2Saved = parseFloat(weight_kg) * co2SavedPerKg;

    // Process uploaded photos
    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        photos.push({
          filename: file.filename,
          originalName: file.originalname,
          url: `/uploads/waste/${file.filename}`
        });
      });
    }

    const trx = await db.transaction();

    try {
      // Create waste log
      const [wasteLogId] = await trx('plastic_waste_logs').insert({
        user_id: req.user.userId,
        plastic_type,
        weight_kg: parseFloat(weight_kg),
        station_id,
        description,
        points_earned: pointsEarned,
        co2_saved_kg: co2Saved,
        photos: photos.length > 0 ? JSON.stringify(photos) : null,
        verified: false
      });

      // Update user profile (add to totals but points pending verification)
      const userProfile = await trx('user_profiles').where({ user_id: req.user.userId }).first();
      if (userProfile) {
        await trx('user_profiles').where({ user_id: req.user.userId }).update({
          plastic_recycled_kg: (userProfile.plastic_recycled_kg || 0) + parseFloat(weight_kg),
          co2_saved_kg: (userProfile.co2_saved_kg || 0) + co2Saved,
          updated_at: new Date()
        });
      }

      await trx.commit();

      const wasteLog = await db('plastic_waste_logs')
        .select(
          'plastic_waste_logs.*',
          'stations.name as station_name'
        )
        .leftJoin('stations', 'plastic_waste_logs.station_id', 'stations.id')
        .where('plastic_waste_logs.id', wasteLogId)
        .first();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('waste-submitted', wasteLog);
      io.to(`station-${station_id}`).emit('waste-submission', { user_id: req.user.userId, weight_kg });

      res.status(201).json({
        message: 'Plastic waste submitted successfully',
        wasteLog: {
          ...wasteLog,
          photos
        },
        pointsEarned,
        co2Saved
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Create waste log error:', error);
    res.status(500).json({ error: 'Failed to submit plastic waste' });
  }
});

// Verify waste submission (admin/station manager only)
router.patch('/:id/verify', requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verified_weight_kg, notes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either verified or rejected' });
    }

    const wasteLog = await db('plastic_waste_logs').where({ id }).first();
    if (!wasteLog) {
      return res.status(404).json({ error: 'Waste log not found' });
    }

    if (wasteLog.status !== 'pending_verification') {
      return res.status(400).json({ error: 'Waste log has already been processed' });
    }

    const trx = await db.transaction();

    try {
      let finalWeight = wasteLog.weight_kg;
      let finalCredit = wasteLog.credit_earned;

      if (status === 'verified' && verified_weight_kg) {
        finalWeight = verified_weight_kg;
        const creditRates = {
          'PET': 10, 'HDPE': 8, 'LDPE': 6, 'PP': 7, 'PS': 5, 'Other': 4
        };
        const creditPerKg = creditRates[wasteLog.waste_type] || creditRates['Other'];
        finalCredit = Math.round(finalWeight * creditPerKg);
      }

      // Update waste log
      await trx('plastic_waste_logs').where({ id }).update({
        status,
        verified_weight_kg: finalWeight,
        credit_earned: status === 'verified' ? finalCredit : 0,
        verification_notes: notes,
        verified_by: req.user.userId,
        verified_at: new Date(),
        updated_at: new Date()
      });

      // Update user profile credits
      const userProfile = await trx('user_profiles').where({ user_id: wasteLog.user_id }).first();
      if (userProfile) {
        const pendingCredits = (userProfile.pending_credits || 0) - wasteLog.credit_earned;
        const earnedCredits = userProfile.total_credits_earned || 0;
        const availableCredits = userProfile.available_credits || 0;

        await trx('user_profiles').where({ user_id: wasteLog.user_id }).update({
          pending_credits: Math.max(0, pendingCredits),
          total_credits_earned: status === 'verified' ? earnedCredits + finalCredit : earnedCredits,
          available_credits: status === 'verified' ? availableCredits + finalCredit : availableCredits,
          updated_at: new Date()
        });
      }

      await trx.commit();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('waste-verified', { id, status, finalCredit });

      res.json({
        message: `Waste submission ${status} successfully`,
        finalWeight,
        finalCredit: status === 'verified' ? finalCredit : 0
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Verify waste error:', error);
    res.status(500).json({ error: 'Failed to verify waste submission' });
  }
});

// Get waste statistics
router.get('/stats/overview', requireAdminOrManager, async (req, res) => {
  try {
    const stats = await Promise.all([
      db('plastic_waste_logs').count('id as count').first(),
      db('plastic_waste_logs').where('status', 'verified').count('id as count').first(),
      db('plastic_waste_logs').where('status', 'pending_verification').count('id as count').first(),
      db('plastic_waste_logs').where('status', 'verified').sum('verified_weight_kg as total').first(),
      db('plastic_waste_logs').where('status', 'verified').sum('credit_earned as total').first(),
      db('plastic_waste_logs').where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)).count('id as count').first()
    ]);

    res.json({
      totalSubmissions: stats[0].count,
      verifiedSubmissions: stats[1].count,
      pendingVerification: stats[2].count,
      totalWeightProcessed: stats[3].total || 0,
      totalCreditsAwarded: stats[4].total || 0,
      submissionsToday: stats[5].count
    });

  } catch (error) {
    console.error('Get waste stats error:', error);
    res.status(500).json({ error: 'Failed to fetch waste statistics' });
  }
});

// Get waste breakdown by type
router.get('/stats/breakdown', requireAdminOrManager, async (req, res) => {
  try {
    const breakdown = await db('plastic_waste_logs')
      .select('waste_type')
      .count('id as count')
      .sum('verified_weight_kg as total_weight')
      .where('status', 'verified')
      .groupBy('waste_type')
      .orderBy('total_weight', 'desc');

    res.json({ breakdown });

  } catch (error) {
    console.error('Get waste breakdown error:', error);
    res.status(500).json({ error: 'Failed to fetch waste breakdown' });
  }
});

module.exports = router;