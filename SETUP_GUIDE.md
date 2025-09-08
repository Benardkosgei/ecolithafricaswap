# EcolithSwap Setup Guide

This guide will walk you through setting up the complete EcolithSwap platform from scratch.

## 📋 Prerequisites Checklist

Before starting, ensure you have the following installed:

- [ ] **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- [ ] **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- [ ] **Git** - [Download](https://git-scm.com/downloads)
- [ ] **npm** (comes with Node.js) or **yarn**
- [ ] **Expo CLI** (for mobile development)
- [ ] **Code Editor** (VS Code recommended)

### Additional Tools (Optional)
- **MySQL Workbench** - For database management
- **Postman** - For API testing
- **Android Studio** - For Android emulator
- **Xcode** - For iOS simulator (macOS only)

## 🗄️ Database Setup

### 1. Install MySQL

**On Windows:**
1. Download MySQL Installer from [MySQL Downloads](https://dev.mysql.com/downloads/installer/)
2. Run the installer and choose "Developer Default"
3. Set root password during installation

**On macOS:**
```bash
# Using Homebrew
brew install mysql
brew services start mysql

# Set root password
mysql_secure_installation
```

**On Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 2. Verify MySQL Installation

```bash
mysql --version
mysql -u root -p
```

You should be able to connect to MySQL with your root credentials.

### 3. Create Database User (Optional but Recommended)

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create a new user for EcolithSwap
CREATE USER 'ecolithswap'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON ecolithswap.* TO 'ecolithswap'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

## 🚀 Step-by-Step Setup

### Step 1: Clone and Setup Backend

```bash
# Clone the repository (replace with actual repo URL)
git clone <repository-url>
cd ecolithswap-platform

# Navigate to backend
cd EcolithSwap-Backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Step 2: Configure Backend Environment

Edit `EcolithSwap-Backend/.env` with your settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=ecolithswap
DB_PASSWORD=secure_password
DB_NAME=ecolithswap

# JWT Configuration (generate random strings for production)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# M-Pesa Configuration (for production)
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
```

### Step 3: Initialize Database

```bash
# Still in EcolithSwap-Backend directory

# Create database and run migrations
npm run setup-db

# Seed with sample data
npm run seed-db

# Start the backend server
npm start
```

You should see:
```
✅ Database connected successfully
🚀 EcolithSwap API Server running on port 3000
📊 Environment: development
🔗 Health check: http://localhost:3000/health
```

### Step 4: Verify Backend

Open your browser and go to `http://localhost:3000/health`

You should see:
```json
{
  "status": "OK",
  "message": "EcolithSwap API Server is running",
  "timestamp": "2025-01-02T...",
  "version": "1.0.0"
}
```

### Step 5: Setup Admin Dashboard

Open a new terminal:

```bash
# Navigate to admin dashboard
cd ecolithswap-admin

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The admin dashboard will start on `http://localhost:5173`

### Step 6: Setup Mobile App

Open another new terminal:

```bash
# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli

# Navigate to mobile app
cd EcolithSwap

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

## 📱 Mobile App Testing

### Option 1: Physical Device
1. Install **Expo Go** from App Store (iOS) or Google Play (Android)
2. Scan the QR code displayed in your terminal
3. The app will load on your device

### Option 2: Emulator/Simulator

**Android Emulator:**
1. Install Android Studio
2. Create an Android Virtual Device (AVD)
3. Start the emulator
4. Press `a` in the Expo terminal to open in Android emulator

**iOS Simulator (macOS only):**
1. Install Xcode from App Store
2. Press `i` in the Expo terminal to open in iOS simulator

## 🔐 Test the Platform

### 1. Test Admin Dashboard

1. Go to `http://localhost:5173`
2. Log in with: `admin@ecolithswap.com` / `password123`
3. Explore the dashboard features

### 2. Test Mobile App

1. Open the mobile app
2. Register a new account or log in with: `john.doe@email.com` / `password123`
3. Test the core features:
   - Find stations
   - View battery information
   - Submit plastic waste (mock data)

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```
❌ MySQL database connection failed
```

**Solutions:**
1. Verify MySQL is running: `brew services list | grep mysql` (macOS) or `sudo service mysql status` (Linux)
2. Check credentials in `.env` file
3. Ensure database user has proper permissions
4. Check if port 3306 is available

#### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```

**Solutions:**
1. Kill the process using the port: `lsof -ti:3000 | xargs kill -9`
2. Change the port in `.env` file: `PORT=3001`

#### npm Install Errors
```
npm ERR! peer dep missing
```

**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` again
4. Try using yarn instead: `yarn install`

#### Expo Metro Bundler Issues
```
Error: Metro bundler failed to start
```

**Solutions:**
1. Clear Expo cache: `npx expo start -c`
2. Reset Metro cache: `npx react-native start --reset-cache`
3. Restart your terminal and try again

### Getting Help

1. **Check Logs**: Look at terminal output for detailed error messages
2. **Database Logs**: Check MySQL error logs
3. **API Testing**: Use Postman to test API endpoints directly
4. **Network Issues**: Ensure all services are running on correct ports

## 🚀 Next Steps

Once everything is running:

1. **Explore Features**: Test all functionality in both admin and mobile apps
2. **Read Documentation**: Review API documentation at `/docs`
3. **Customize**: Modify the code to fit your specific requirements
4. **Deploy**: Follow deployment guide for production setup

## 📋 Development Workflow

### Daily Development
```bash
# Terminal 1: Backend
cd EcolithSwap-Backend
npm run dev  # Uses nodemon for auto-restart

# Terminal 2: Admin Dashboard
cd ecolithswap-admin
npm run dev

# Terminal 3: Mobile App
cd EcolithSwap
npx expo start
```

### Database Management
```bash
# Run new migrations
npm run migrate

# Rollback migrations
npm run rollback

# Reset database (⚠️ destructive)
npm run setup-db
npm run seed-db
```

### Code Quality
```bash
# Run tests
npm test

# Check linting
npm run lint

# Format code
npm run format
```

## 🎯 Success Checklist

After completing setup, you should have:

- [ ] Backend API running on `http://localhost:3000`
- [ ] Admin dashboard running on `http://localhost:5173`
- [ ] Mobile app running in Expo
- [ ] MySQL database with sample data
- [ ] Ability to log into admin dashboard
- [ ] Ability to register/login in mobile app
- [ ] All main features accessible

**Congratulations! 🎉 Your EcolithSwap platform is now ready for development!**