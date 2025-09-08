# EcolithSwap Deployment Guide

This guide covers deploying the EcolithSwap platform to production environments.

## 🏗️ Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │ Admin Dashboard │    │   Backend API   │
│                 │    │                 │    │                 │
│  React Native   │    │   React + TS    │    │  Node.js + DB   │
│                 │    │                 │    │                 │
│ App Store +     │    │ Static Hosting  │    │ Cloud Server    │
│ Google Play     │    │ (Netlify/Vercel)│    │ (AWS/DO/Azure)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🗄️ Database Deployment

### Option 1: Cloud Database (Recommended)

#### AWS RDS MySQL
```bash
# 1. Create RDS instance via AWS Console
# 2. Configure security groups
# 3. Note connection details

# Connection details will be:
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your-secure-password
DB_NAME=ecolithswap
```

#### DigitalOcean Managed Database
```bash
# 1. Create managed MySQL database
# 2. Configure firewall rules
# 3. Get connection string

DB_HOST=your-db-host.db.ondigitalocean.com
DB_PORT=25060
DB_USER=doadmin
DB_PASSWORD=your-password
DB_NAME=ecolithswap
```

#### Google Cloud SQL
```bash
# 1. Create Cloud SQL MySQL instance
# 2. Configure authorized networks
# 3. Create database and user

DB_HOST=your-instance-ip
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=ecolithswap
```

### Option 2: Self-Hosted Database

#### Ubuntu Server Setup
```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server

# Secure installation
sudo mysql_secure_installation

# Create database and user
mysql -u root -p
CREATE DATABASE ecolithswap;
CREATE USER 'ecolithswap'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON ecolithswap.* TO 'ecolithswap'@'%';
FLUSH PRIVILEGES;

# Configure for remote access
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Change bind-address to 0.0.0.0

# Restart MySQL
sudo systemctl restart mysql

# Configure firewall
sudo ufw allow 3306
```

### Database Initialization
```bash
# Clone repository on server
git clone <your-repo-url>
cd ecolithswap-platform/EcolithSwap-Backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with production database credentials

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed-db
```

## 🖥️ Backend API Deployment

### Option 1: DigitalOcean Droplet

#### Server Setup
```bash
# Create Ubuntu 20.04 droplet
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install nginx -y

# Clone your repository
git clone <your-repo-url>
cd ecolithswap-platform/EcolithSwap-Backend

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
nano .env
```

#### Production Environment Configuration
```env
# .env for production
NODE_ENV=production
PORT=3000

# Database (use your cloud database credentials)
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=ecolithswap

# JWT (generate strong secrets)
JWT_SECRET=your-super-long-random-jwt-secret-for-production
JWT_REFRESH_SECRET=your-super-long-random-refresh-secret-for-production

# CORS (your domain)
FRONTEND_URL=https://admin.yourdomain.com

# M-Pesa Production
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your-production-mpesa-key
MPESA_CONSUMER_SECRET=your-production-mpesa-secret
```

#### PM2 Process Management
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ecolithswap-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup
pm2 startup
```

#### Nginx Configuration
```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/ecolithswap-api << EOF
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/ecolithswap-api /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

#### SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
certbot --nginx -d api.yourdomain.com

# Auto-renewal setup (already configured by default)
certbot renew --dry-run
```

### Option 2: AWS EC2

#### Launch EC2 Instance
```bash
# 1. Launch Ubuntu 20.04 instance
# 2. Configure security groups (ports 22, 80, 443)
# 3. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Follow same setup as DigitalOcean above
```

### Option 3: Heroku

#### Heroku Deployment
```bash
# Install Heroku CLI
# Create Heroku app
heroku create ecolithswap-api

# Add MySQL addon
heroku addons:create cleardb:ignite

# Get database URL
heroku config:get CLEARDB_DATABASE_URL

# Configure environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-refresh-secret
# ... other variables

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate
```

## 🌐 Admin Dashboard Deployment

### Option 1: Netlify (Recommended)

#### Netlify Deployment
```bash
# Build for production
cd ecolithswap-admin
npm run build

# Deploy to Netlify
# 1. Connect GitHub repository to Netlify
# 2. Set build command: npm run build
# 3. Set publish directory: dist
# 4. Configure environment variables in Netlify dashboard
```

#### Environment Variables in Netlify
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_TITLE=EcolithSwap Admin
```

### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd ecolithswap-admin
vercel

# Configure environment variables in Vercel dashboard
```

### Option 3: AWS S3 + CloudFront

```bash
# Build project
npm run build

# Create S3 bucket for static hosting
# Upload dist/ contents to S3
# Configure CloudFront distribution
# Update DNS records
```

## 📱 Mobile App Deployment

### iOS App Store

#### Prerequisites
- Apple Developer Account ($99/year)
- macOS with Xcode
- iOS Distribution Certificate

#### Build and Deploy
```bash
# Configure app.json
{
  "expo": {
    "name": "EcolithSwap",
    "slug": "ecolithswap",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.ecolithswap.app",
      "buildNumber": "1"
    }
  }
}

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Google Play Store

#### Prerequisites
- Google Play Developer Account ($25 one-time)
- Keystore for signing

#### Build and Deploy
```bash
# Configure app.json
{
  "expo": {
    "android": {
      "package": "com.ecolithswap.app",
      "versionCode": 1
    }
  }
}

# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

### Expo Updates (OTA)

```bash
# Configure automatic updates
eas update --auto

# Manual update
eas update --branch production --message "Bug fixes and improvements"
```

## 🔐 Security Configuration

### Backend Security

#### Environment Variables
```env
# Generate strong secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Database connection with SSL
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Trusted origins
CORS_ORIGIN=https://admin.yourdomain.com,https://yourdomain.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Firewall Configuration
```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Database Security

```sql
-- Use strong passwords
-- Limit user privileges
-- Enable SSL connections
-- Regular backups
-- Monitor access logs
```

## 📊 Monitoring and Logging

### Application Monitoring

#### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs ecolithswap-api

# Restart app
pm2 restart ecolithswap-api
```

#### Log Management
```bash
# Rotate logs
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Monitoring

```bash
# Monitor MySQL performance
mysqladmin -u root -p status
mysqladmin -u root -p processlist

# Enable slow query log
# Add to /etc/mysql/mysql.conf.d/mysqld.cnf
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
```

## 🔄 Backup Strategy

### Database Backup

```bash
# Create backup script
cat > /home/ubuntu/backup-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=\$(date +"%Y%m%d_%H%M%S")
FILENAME="ecolithswap_\${DATE}.sql"

mkdir -p \$BACKUP_DIR
mysqldump -h \$DB_HOST -u \$DB_USER -p\$DB_PASSWORD ecolithswap > \$BACKUP_DIR/\$FILENAME
gzip \$BACKUP_DIR/\$FILENAME

# Keep only last 7 days
find \$BACKUP_DIR -name "*.gz" -mtime +7 -delete
EOF

# Make executable
chmod +x /home/ubuntu/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

### Application Backup

```bash
# Backup application files
tar -czf ecolithswap-app-$(date +%Y%m%d).tar.gz /path/to/ecolithswap-platform

# Upload to S3 (optional)
aws s3 cp ecolithswap-app-$(date +%Y%m%d).tar.gz s3://your-backup-bucket/
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Database server configured and accessible
- [ ] SSL certificates obtained
- [ ] Environment variables configured
- [ ] Security groups/firewall rules set
- [ ] Domain names configured
- [ ] Backup strategy implemented

### Backend Deployment
- [ ] Application server provisioned
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] PM2 process manager configured
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Health checks passing

### Frontend Deployment
- [ ] Admin dashboard built and deployed
- [ ] Environment variables configured
- [ ] CDN configured (if applicable)
- [ ] Custom domain configured
- [ ] SSL certificate active

### Mobile App Deployment
- [ ] App store accounts set up
- [ ] App configurations finalized
- [ ] Builds created and tested
- [ ] Store listings created
- [ ] Apps submitted for review

### Post-Deployment
- [ ] All services accessible via HTTPS
- [ ] API endpoints responding correctly
- [ ] Admin dashboard functional
- [ ] Mobile apps approved and published
- [ ] Monitoring systems active
- [ ] Backup systems verified
- [ ] Performance testing completed

## 🔧 Maintenance

### Regular Tasks

#### Weekly
- [ ] Check server resource usage
- [ ] Review application logs
- [ ] Monitor database performance
- [ ] Verify backup integrity

#### Monthly
- [ ] Update system packages
- [ ] Review security logs
- [ ] Performance optimization
- [ ] Capacity planning review

#### Quarterly
- [ ] Security audit
- [ ] Dependency updates
- [ ] Disaster recovery testing
- [ ] Performance benchmarking

### Emergency Procedures

#### Application Down
1. Check PM2 process status
2. Review application logs
3. Restart services if needed
4. Check database connectivity
5. Verify external dependencies

#### Database Issues
1. Check MySQL service status
2. Review database logs
3. Check disk space
4. Verify connections
5. Restore from backup if needed

## 📞 Support and Monitoring

### Monitoring Tools
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Application monitoring**: New Relic, DataDog
- **Log management**: LogRocket, Papertrail
- **Performance monitoring**: GTmetrix, WebPageTest

### Alert Configuration
- API response time > 5 seconds
- Error rate > 5%
- Database connections > 80%
- Disk space > 85%
- Memory usage > 90%

---

**🎉 Congratulations! Your EcolithSwap platform is now deployed to production!**