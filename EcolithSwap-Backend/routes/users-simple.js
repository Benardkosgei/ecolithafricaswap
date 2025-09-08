const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get all users with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      role = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = db('users')
      .select(
        'users.id',
        'users.email',
        'users.full_name',
        'users.phone',
        'users.location',
        'users.role',
        'users.is_active',
        'users.email_verified',
        'users.phone_verified',
        'users.last_login',
        'users.created_at',
        'user_profiles.total_credits_earned',
        'user_profiles.available_credits'
      )
      .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
      .orderBy(`users.${sort_by}`, sort_order);

    // Search filter
    if (search) {
      query = query.where(function() {
        this.where('users.full_name', 'like', `%${search}%`)
            .orWhere('users.email', 'like', `%${search}%`)
            .orWhere('users.phone', 'like', `%${search}%`);
      });
    }

    // Role filter
    if (role && role !== 'all') {
      query = query.where('users.role', role);
    }

    const users = await query.limit(parseInt(limit)).offset(offset);
    
    // Get total count
    let countQuery = db('users');
    if (search) {
      countQuery = countQuery.where(function() {
        this.where('full_name', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`)
            .orWhere('phone', 'like', `%${search}%`);
      });
    }
    if (role && role !== 'all') countQuery = countQuery.where('role', role);
    
    const totalCount = await countQuery.count('id as count').first();

    res.json({
      data: users,
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db('users')
      .select(
        'users.*',
        'user_profiles.total_credits_earned',
        'user_profiles.available_credits',
        'user_profiles.pending_credits'
      )
      .leftJoin('user_profiles', 'users.id', 'user_profiles.user_id')
      .where('users.id', id)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash from response
    delete user.password_hash;

    res.json({ data: user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalUsers = await db('users').count('id as count').first();
    const activeUsers = await db('users').where('is_active', true).count('id as count').first();
    const adminUsers = await db('users').where('role', 'admin').count('id as count').first();
    const customerUsers = await db('users').where('role', 'customer').count('id as count').first();
    const managerUsers = await db('users').where('role', 'station_manager').count('id as count').first();
    const verifiedUsers = await db('users').where('email_verified', true).count('id as count').first();

    res.json({
      data: {
        totalUsers: totalUsers.count,
        activeUsers: activeUsers.count,
        adminUsers: adminUsers.count,
        customerUsers: customerUsers.count,
        managerUsers: managerUsers.count,
        verifiedUsers: verifiedUsers.count
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Update user status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const updated = await db('users')
      .where('id', id)
      .update({ 
        is_active,
        updated_at: new Date()
      });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      data: { 
        message: 'User status updated successfully' 
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user role
router.patch('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updated = await db('users')
      .where('id', id)
      .update({ 
        role,
        updated_at: new Date()
      });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      data: { 
        message: 'User role updated successfully' 
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deletion of admin users
    const user = await db('users').where('id', id).first();
    if (user && user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    const deleted = await db('users')
      .where('id', id)
      .del();

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      data: { 
        message: 'User deleted successfully' 
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Bulk update users
router.patch('/bulk/update', async (req, res) => {
  try {
    const { user_ids, update_data } = req.body;

    const updated = await db('users')
      .whereIn('id', user_ids)
      .update({
        ...update_data,
        updated_at: new Date()
      });

    res.json({ 
      data: { 
        updated_count: updated,
        message: `${updated} users updated successfully`
      }
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update users' });
  }
});

module.exports = router;
