const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { profileImageUpload, handleUploadError, cleanupOnError } = require('../middleware/fileUpload');

const router = express.Router();

// Get user profile
router.get('/:userId', requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await db('user_profiles')
      .select(
        'user_profiles.*',
        'users.email',
        'users.full_name',
        'users.phone',
        'users.location',
        'users.role',
        'users.email_verified',
        'users.phone_verified',
        'users.created_at as user_created_at'
      )
      .leftJoin('users', 'user_profiles.user_id', 'users.id')
      .where('user_profiles.user_id', userId)
      .first();

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Parse preferences JSON if it exists
    if (profile.preferences) {
      try {
        profile.preferences = JSON.parse(profile.preferences);
      } catch (e) {
        profile.preferences = {};
      }
    }

    res.json({ profile });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/:userId', 
  requireOwnershipOrAdmin('userId'),
  profileImageUpload.single('avatar'),
  handleUploadError,
  cleanupOnError,
  [
    body('date_of_birth').optional().isISO8601().withMessage('Valid date of birth required'),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
    body('preferred_language').optional().isLength({ min: 2, max: 5 }).withMessage('Invalid language code')
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        date_of_birth,
        gender,
        occupation,
        vehicle_type,
        vehicle_model,
        license_plate,
        preferences,
        notifications_enabled,
        sms_notifications,
        email_notifications,
        preferred_language
      } = req.body;

      // Check if profile exists
      const existingProfile = await db('user_profiles').where({ user_id: userId }).first();
      if (!existingProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const updateData = {
        updated_at: new Date()
      };

      if (date_of_birth) updateData.date_of_birth = date_of_birth;
      if (gender) updateData.gender = gender;
      if (occupation) updateData.occupation = occupation;
      if (vehicle_type) updateData.vehicle_type = vehicle_type;
      if (vehicle_model) updateData.vehicle_model = vehicle_model;
      if (license_plate) updateData.license_plate = license_plate;
      if (preferences) updateData.preferences = JSON.stringify(preferences);
      if (notifications_enabled !== undefined) updateData.notifications_enabled = notifications_enabled;
      if (sms_notifications !== undefined) updateData.sms_notifications = sms_notifications;
      if (email_notifications !== undefined) updateData.email_notifications = email_notifications;
      if (preferred_language) updateData.preferred_language = preferred_language;

      if (req.file) {
        updateData.avatar_url = `/uploads/profiles/${req.file.filename}`;
      }

      await db('user_profiles').where({ user_id: userId }).update(updateData);

      const updatedProfile = await db('user_profiles').where({ user_id: userId }).first();
      
      // Parse preferences for response
      if (updatedProfile.preferences) {
        try {
          updatedProfile.preferences = JSON.parse(updatedProfile.preferences);
        } catch (e) {
          updatedProfile.preferences = {};
        }
      }

      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });

    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  }
);

// Get user activity summary
router.get('/:userId/activity', requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
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

    const activity = await Promise.all([
      // Recent rentals
      db('battery_rentals')
        .select(
          'battery_rentals.*',
          'batteries.battery_code',
          'pickup_stations.name as pickup_station_name',
          'return_stations.name as return_station_name'
        )
        .leftJoin('batteries', 'battery_rentals.battery_id', 'batteries.id')
        .leftJoin('stations as pickup_stations', 'battery_rentals.pickup_station_id', 'pickup_stations.id')
        .leftJoin('stations as return_stations', 'battery_rentals.return_station_id', 'return_stations.id')
        .where('battery_rentals.user_id', userId)
        .where('battery_rentals.created_at', '>=', startDate)
        .orderBy('battery_rentals.created_at', 'desc')
        .limit(10),
        
      // Recent waste submissions
      db('plastic_waste_logs')
        .select(
          'plastic_waste_logs.*',
          'stations.name as station_name'
        )
        .leftJoin('stations', 'plastic_waste_logs.station_id', 'stations.id')
        .where('plastic_waste_logs.user_id', userId)
        .where('plastic_waste_logs.created_at', '>=', startDate)
        .orderBy('plastic_waste_logs.created_at', 'desc')
        .limit(10),
        
      // Recent payments
      db('payments')
        .select('payments.*')
        .where('payments.user_id', userId)
        .where('payments.created_at', '>=', startDate)
        .orderBy('payments.created_at', 'desc')
        .limit(10),
        
      // Activity stats for period
      db('battery_rentals')
        .where('user_id', userId)
        .where('created_at', '>=', startDate)
        .count('id as rental_count')
        .sum('total_cost as total_spent')
        .first(),
        
      db('plastic_waste_logs')
        .where('user_id', userId)
        .where('created_at', '>=', startDate)
        .count('id as waste_submissions')
        .sum('weight_kg as total_weight')
        .sum('points_earned as total_points')
        .first()
    ]);

    res.json({
      period,
      recentRentals: activity[0],
      recentWasteSubmissions: activity[1],
      recentPayments: activity[2],
      stats: {
        rentals: activity[3],
        waste: activity[4]
      }
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Update user points (admin only)
router.patch('/:userId/points', requireAdmin, [
  body('points_adjustment').isInt().withMessage('Points adjustment must be an integer'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const { userId } = req.params;
    const { points_adjustment, reason } = req.body;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const profile = await db('user_profiles').where({ user_id: userId }).first();
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const newPointsBalance = (profile.current_points || 0) + points_adjustment;
    
    if (newPointsBalance < 0) {
      return res.status(400).json({ error: 'Insufficient points balance' });
    }

    await db('user_profiles').where({ user_id: userId }).update({
      current_points: newPointsBalance,
      total_points_earned: points_adjustment > 0 ? 
        (profile.total_points_earned || 0) + points_adjustment : 
        profile.total_points_earned,
      total_points_redeemed: points_adjustment < 0 ? 
        (profile.total_points_redeemed || 0) + Math.abs(points_adjustment) : 
        profile.total_points_redeemed,
      updated_at: new Date()
    });

    // Log the points transaction
    await db('points_transactions').insert({
      user_id: userId,
      points_change: points_adjustment,
      reason,
      processed_by: req.user.userId,
      created_at: new Date()
    });

    res.json({
      message: 'Points updated successfully',
      new_balance: newPointsBalance,
      adjustment: points_adjustment
    });

  } catch (error) {
    console.error('Update user points error:', error);
    res.status(500).json({ error: 'Failed to update user points' });
  }
});

// Get user points history
router.get('/:userId/points/history', requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const pointsHistory = await db('points_transactions')
      .select(
        'points_transactions.*',
        'users.full_name as processed_by_name'
      )
      .leftJoin('users', 'points_transactions.processed_by', 'users.id')
      .where('points_transactions.user_id', userId)
      .orderBy('points_transactions.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(offset);

    const totalCount = await db('points_transactions')
      .where('user_id', userId)
      .count('id as count')
      .first();

    res.json({
      pointsHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get points history error:', error);
    res.status(500).json({ error: 'Failed to fetch points history' });
  }
});

module.exports = router;