const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('express-async-errors');
require('dotenv').config();

const { demoDb, initializeDemoData } = require('./demo-data');

// Initialize demo data
initializeDemoData();

// Demo routes (simplified versions)
const demoAuthRoutes = require('./demo-routes/auth');
const demoStationRoutes = require('./demo-routes/stations');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Port configuration
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make demo db available in requests
app.use((req, res, next) => {
  req.db = demoDb;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'EcolithSwap Demo API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo',
    mode: 'demo'
  });
});

// API Routes
app.use('/api/auth', demoAuthRoutes);
app.use('/api/stations', demoStationRoutes);

// Demo dashboard endpoint
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const stats = {
      users: {
        total: await req.db.count('users'),
        active: await req.db.count('users', { is_active: true }),
        newThisMonth: 2
      },
      batteries: {
        total: await req.db.count('batteries'),
        available: await req.db.count('batteries', { status: 'available' }),
        rented: await req.db.count('batteries', { status: 'rented' })
      },
      stations: {
        total: await req.db.count('stations'),
        active: await req.db.count('stations', { is_active: true })
      },
      rentals: {
        total: await req.db.count('battery_rentals'),
        active: await req.db.count('battery_rentals', { status: 'active' }),
        totalRevenue: 2500
      },
      waste: {
        totalProcessed: 150.5,
        pendingVerification: 3
      },
      payments: {
        totalRevenue: 5000,
        revenueToday: 250
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Demo users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await req.db.query('users');
    const usersWithoutPasswords = users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json({
      users: usersWithoutPasswords,
      pagination: {
        page: 1,
        limit: 10,
        total: users.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Demo batteries endpoint
app.get('/api/batteries', async (req, res) => {
  try {
    const batteries = await req.db.query('batteries');
    
    res.json({
      batteries,
      pagination: {
        page: 1,
        limit: 10,
        total: batteries.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Get batteries error:', error);
    res.status(500).json({ error: 'Failed to fetch batteries' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined real-time updates');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available in routes
app.set('io', io);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`
  });
});

// Start server
server.listen(PORT, () => {
  console.log('🎭 ===== DEMO MODE =====');
  console.log(`🚀 EcolithSwap Demo API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('💾 Using in-memory demo data (no MySQL required)');
  console.log('🎭 =====================');
});

module.exports = { app, io };
