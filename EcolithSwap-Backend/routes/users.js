const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = db('users')
      .select('id', 'email', 'full_name', 'phone', 'location', 'role', 'is_active', 'created_at', 'last_login')
      .orderBy('created_at', 'desc');

    if (search) {
      query = query.where(function() {
        this.where('full_name', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`)
            .orWhere('phone', 'like', `%${search}%`);
      });
    }

    if (role) {
      query = query.where('role', role);
    }

    const users = await query.limit(limit).offset(offset);
    const totalCount = await db('users').count('id as count').first();

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', requireOwnershipOrAdmin('id'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db('users')
      .select('id', 'email', 'full_name', 'phone', 'location', 'role', 'is_active', 'created_at', 'last_login')
      .where({ id })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await db('user_profiles').where({ user_id: id }).first();

    res.json({
      user: {
        ...user,
        profile
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user status (admin only)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await db('users').where({ id }).update({
      is_active,
      updated_at: new Date()
    });

    res.json({ message: 'User status updated successfully' });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'admin', 'station_manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await db('users').where({ id }).update({
      role,
      updated_at: new Date()
    });

    res.json({ message: 'User role updated successfully' });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user profile first (foreign key constraint)
    await db('user_profiles').where({ user_id: id }).del();
    
    // Delete user
    await db('users').where({ id }).del();

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', requireAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      db('users').count('id as count').first(),
      db('users').where('is_active', true).count('id as count').first(),
      db('users').where('role', 'customer').count('id as count').first(),
      db('users').where('role', 'admin').count('id as count').first(),
      db('users').where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).count('id as count').first()
    ]);

    res.json({
      totalUsers: stats[0].count,
      activeUsers: stats[1].count,
      customers: stats[2].count,
      admins: stats[3].count,
      newUsersThisMonth: stats[4].count
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;