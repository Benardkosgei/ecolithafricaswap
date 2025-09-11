const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Check if phone already exists
    const existingPhone = await db('users').where({ phone }).first();
    if (existingPhone) {
      return res.status(409).json({ error: 'User with this phone number already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);
    
    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString('hex');

    const trx = await db.transaction();
    
    try {
      // Create user
      const [userId] = await trx('users').insert({
        email,
        password_hash,
        full_name,
        phone,
        location,
        role: 'customer',
        is_active: true,
        email_verified: false,
        phone_verified: false,
        verification_token
      });

      // Create user profile
      await trx('user_profiles').insert({
        user_id: userId,
        total_swaps: 0,
        total_distance_km: 0,
        total_amount_spent: 0,
        plastic_recycled_kg: 0,
        co2_saved_kg: 0,
        money_saved: 0,
        current_points: 0,
        total_points_earned: 0,
        total_points_redeemed: 0,
        notifications_enabled: true,
        sms_notifications: true,
        email_notifications: true,
        preferred_language: 'en'
      });

      await trx.commit();

      // Generate JWT token
      const token = jwt.sign(
        { userId, email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: userId,
          email,
          full_name,
          phone,
          location,
          role: 'customer',
          verification_token
        }
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db('users').where({ id: user.id }).update({ last_login: new Date() });

    // Get user profile
    const profile = await db('user_profiles').where({ user_id: user.id }).first();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        location: user.location,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        profile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Get user
    const user = await db('users').where({ id: decoded.userId }).first();
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { verification_token } = req.body;

    if (!verification_token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await db('users').where({ verification_token }).first();
    if (!user) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    await db('users').where({ id: user.id }).update({
      email_verified: true,
      verification_token: null,
      updated_at: new Date()
    });

    res.json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db('users').where({ id: user.id }).update({
      password_reset_token: resetToken,
      password_reset_expires: resetTokenExpiry,
      updated_at: new Date()
    });

    // TODO: Send email with reset link
    // In production, you would send an email here
    
    res.json({ 
      message: 'If an account with that email exists, a reset link has been sent.',
      resetToken // Remove this in production
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    const user = await db('users')
      .where({ password_reset_token: token })
      .where('password_reset_expires', '>', new Date())
      .first();

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    await db('users').where({ id: user.id }).update({
      password_hash,
      password_reset_token: null,
      password_reset_expires: null,
      updated_at: new Date()
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Change password (authenticated)
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 12);

    await db('users').where({ id: userId }).update({
      password_hash,
      updated_at: new Date()
    });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await db('users')
      .select('id', 'email', 'full_name', 'phone', 'location', 'role', 'email_verified', 'phone_verified', 'created_at')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await db('user_profiles').where({ user_id: userId }).first();

    res.json({
      user: {
        ...user,
        profile
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { full_name, phone, location, email } = req.body;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await db('users').where({ email }).whereNot({ id: userId }).first();
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use by another account' });
      }
    }

    // Check if phone is being changed and if it already exists
    if (phone) {
      const existingPhone = await db('users').where({ phone }).whereNot({ id: userId }).first();
      if (existingPhone) {
        return res.status(409).json({ error: 'Phone number already in use by another account' });
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (email) {
      updateData.email = email;
      updateData.email_verified = false; // Reset verification if email changes
    }

    await db('users').where({ id: userId }).update(updateData);

    const updatedUser = await db('users')
      .select('id', 'email', 'full_name', 'phone', 'location', 'role', 'email_verified', 'phone_verified')
      .where({ id: userId })
      .first();

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;