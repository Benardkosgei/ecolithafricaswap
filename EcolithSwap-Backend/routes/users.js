const express = require('express');
const bcrypt = require('bcryptjs');
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

    let countQuery = db('users').count('id as count').first();

    if (search) {
      const searchTerm = `%${search}%`;
      const searchFilter = function() {
        this.where('full_name', 'like', searchTerm)
            .orWhere('email', 'like', searchTerm)
            .orWhere('phone', 'like', searchTerm);
      };
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }

    if (role) {
      query = query.where('role', role);
      countQuery = countQuery.where('role', role);
    }

    const users = await query.limit(limit).offset(offset);
    const totalCount = await countQuery;

    res.json({
      data: users,
      totalPages: Math.ceil(totalCount.count / limit),
      currentPage: parseInt(page),
      totalUsers: totalCount.count,
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user (admin only)
router.post('/', requireAdmin, [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('phone').isMobilePhone().withMessage('A valid phone number is required'),
    body('role').isIn(['customer', 'admin', 'station_manager']).withMessage('Invalid user role'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name, phone, location, role } = req.body;

    try {
        const existingUser = await db('users').where({ email }).orWhere({ phone }).first();
        if (existingUser) {
            return res.status(409).json({ error: 'A user with this email or phone number already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        
        const trx = await db.transaction();
        try {
            const [userId] = await trx('users').insert({
                email,
                password_hash,
                full_name,
                phone,
                location,
                role,
                is_active: true,
                email_verified: true, // Assuming admin-created users are pre-verified
            });

            await trx('user_profiles').insert({
                user_id: userId,
                // You can add default profile values here
            });

            await trx.commit();

            res.status(201).json({ message: 'User created successfully', userId });

        } catch (error) {
            await trx.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create new user.' });
    }
});

// Get user by ID
router.get('/:id', requireOwnershipOrAdmin('id'), async (req, res) => {
  // ... (existing code)
});

// Update user details (admin only)
router.put('/:id', requireAdmin, [
    body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().isMobilePhone().withMessage('A valid phone number is required'),
    body('email').optional().isEmail().withMessage('A valid email is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { full_name, phone, email, location, role, is_active } = req.body;

    try {
        const updateData = {};
        if (full_name) updateData.full_name = full_name;
        if (phone) updateData.phone = phone;
        if (email) updateData.email = email;
        if (location) updateData.location = location;
        if (role) updateData.role = role;
        if (is_active !== undefined) updateData.is_active = is_active;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No update information provided.' });
        }

        updateData.updated_at = new Date();

        const updated = await db('users').where({ id }).update(updateData);

        if (updated) {
            res.json({ message: 'User updated successfully' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user.' });
    }
});

// ... (rest of the existing code for status, role, delete, and stats)

module.exports = router;
