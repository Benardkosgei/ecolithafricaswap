# EcolithSwap Backend Setup Guide

## Overview
The EcolithSwap backend has been successfully configured and is ready to run. This guide explains how to start the backend server and connect it with the admin dashboard.

## Prerequisites
- Node.js 16+ installed
- SQLite database (already configured)

## Quick Start

### 1. Start the Backend Server
```bash
cd /workspace/EcolithSwap-Backend
npm install
node setup-simple-db.js  # Initialize database (if not already done)
npm start
```

The backend will start on `http://localhost:3000`

### 2. Admin Login Credentials
- **Email:** admin@ecolithswap.com
- **Password:** password123

### 3. Station Manager Login
- **Email:** manager@ecolithswap.com
- **Password:** password123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Stations Management
- `GET /api/stations` - Get all stations with pagination and filtering
- `GET /api/stations/:id` - Get station by ID
- `GET /api/stations/stats/overview` - Get station statistics
- `POST /api/stations` - Create new station
- `PUT /api/stations/:id` - Update station
- `DELETE /api/stations/:id` - Delete station
- `PATCH /api/stations/:id/maintenance` - Toggle maintenance mode
- `PATCH /api/stations/bulk/update` - Bulk update stations

### Sample Data
The database includes:
- 4 sample charging stations
- 5 sample batteries
- Admin and station manager accounts
- Realistic location data for Nairobi, Kenya

## Database Schema

### Users Table
- id, email, password_hash, full_name, phone, location, role, is_active

### Stations Table
- id, name, address, latitude, longitude, station_type, total_slots, available_batteries
- is_active, accepts_plastic, self_service, maintenance_mode
- operating_hours, contact_info, manager details

### Batteries Table
- id, serial_number, model, capacity_kwh, current_charge_percentage
- status, health_status, current_station_id

## Testing the API

### Test Authentication
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecolithswap.com","password":"password123"}'
```

### Test Stations Endpoint
```bash
curl -X GET http://localhost:3000/api/stations
```

## Integration with Frontend
The admin dashboard at `https://f6rjpytds6be.space.minimax.io` is configured to connect to `http://localhost:3000/api`. 

**Important:** For the frontend to work properly:
1. The backend must be running locally on port 3000
2. CORS is already configured to allow frontend connections
3. JWT authentication is implemented and working

## Troubleshooting

### Database Issues
- If database is corrupted: Run `node setup-simple-db.js` to recreate
- Check database file exists: `ls -la ecolithswap.db`

### Port Issues
- Default port is 3000
- Change port by setting `PORT` environment variable

### CORS Issues
- Frontend URL is whitelisted in CORS settings
- Additional origins can be added in `server.js`

## Production Deployment Notes
- Use environment variables for sensitive configuration
- Consider using PostgreSQL or MySQL for production
- Implement proper error logging and monitoring
- Use HTTPS in production

## Current Status
✅ Database initialized with sample data
✅ Authentication system working
✅ Station management API functional
✅ CORS configured for frontend integration
✅ JWT token system implemented
✅ Error handling in place
