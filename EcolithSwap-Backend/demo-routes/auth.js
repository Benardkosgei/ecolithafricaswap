const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId, role) => {
  const payload = { userId, role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '24h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'demo-refresh-secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        message: 'Email and password are required' 
      });
    }

    // Find user in demo data
    const user = await req.db.findOne('users', { email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Account disabled', 
        message: 'Your account has been disabled. Please contact support.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect' 
      });
    }

    // Update last login
    await req.db.update('users', { id: user.id }, { last_login: new Date() });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Get user profile data
    const userProfile = await req.db.findOne('user_profiles', { user_id: user.id });

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      location: user.location,
      role: user.role,
      is_active: user.is_active,
      profile: userProfile
    };

    res.json({
      message: 'Login successful',
      user: userData,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: 'An error occurred during login' 
    });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, location } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        message: 'Email, password, and full name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await req.db.findOne('users', { email });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists', 
        message: 'An account with this email already exists' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [userId] = await req.db.insert('users', {
      email,
      password_hash: passwordHash,
      full_name: fullName,
      phone,
      location,
      role: 'customer',
      is_active: true
    });

    // Create user profile
    await req.db.insert('user_profiles', {
      user_id: userId,
      total_credits_earned: 0,
      available_credits: 0,
      pending_credits: 0
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userId, 'customer');

    // Get user data (without password)
    const userData = await req.db.findOne('users', { id: userId });
    const { password_hash, ...userWithoutPassword } = userData;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      message: 'An error occurred during registration' 
    });
  }
});

// Get current user profile (with simple token validation)
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
    
    // Get user data
    const user = await req.db.findOne('users', { id: decoded.userId });
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const profile = await req.db.findOne('user_profiles', { user_id: decoded.userId });

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      user: {
        ...userWithoutPassword,
        profile
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile' 
    });
  }
});

module.exports = router;