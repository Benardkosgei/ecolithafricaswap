# EcolithSwap Deployment Guide

This guide covers deploying the EcolithSwap React Native app to production environments.

## 🏗️ Prerequisites

### Development Environment
- Node.js 16+ installed
- Expo CLI installed globally
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)
- Supabase account and project
- Google Cloud Console account (for Maps API)

### Production Services
- **Supabase Project**: Database and authentication
- **Google Maps API**: Location services
- **Safaricom Daraja API**: M-Pesa payments (Kenya)
- **Google Play Console**: Android app distribution
- **Apple Developer Program**: iOS app distribution

## 🔧 Environment Setup

### 1. Supabase Configuration

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com and create new project
   # Note your project URL and anon key
   ```

2. **Database Setup**
   ```sql
   -- Run the complete schema from src/services/supabase.js
   -- Enable Row Level Security (RLS) on all tables
   -- Create necessary policies for user access
   ```

3. **Authentication Setup**
   ```sql
   -- Enable email authentication
   -- Configure email templates
   -- Set up social login providers if needed
   ```

### 2. Environment Variables

Create production `.env` file:

```bash
# Production Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Google Maps (Production)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-production-maps-key

# M-Pesa (Production)
MPESA_CONSUMER_KEY=your-production-consumer-key
MPESA_CONSUMER_SECRET=your-production-consumer-secret
MPESA_BUSINESS_SHORT_CODE=your-production-short-code
MPESA_PASSKEY=your-production-passkey
MPESA_ENVIRONMENT=production

# App Configuration
APP_ENV=production
APP_VERSION=1.0.0

# Support Configuration (Production)
SUPPORT_PHONE=+254712345678
SUPPORT_EMAIL=support@ecolithswap.co.ke
SUPPORT_SMS=+254712345678
```

### 3. Google Maps API Setup

1. **Enable APIs**
   ```bash
   # In Google Cloud Console, enable:
   # - Maps SDK for Android
   # - Maps SDK for iOS
   # - Places API
   # - Geocoding API
   # - Directions API
   ```

2. **API Key Configuration**
   ```bash
   # Create API key and restrict to your app
   # Add package name restrictions for security
   ```

### 4. M-Pesa Integration

1. **Daraja API Registration**
   ```bash
   # Register at https://developer.safaricom.co.ke
   # Create app and get production credentials
   # Configure webhook URLs for callbacks
   ```

2. **Business Setup**
   ```bash
   # Configure business short code
   # Set up paybill/till number
   # Configure callback URLs
   ```

## 📱 Build Configuration

### Android Configuration

1. **Update `app.json`**
   ```json
   {
     "expo": {
       "android": {
         "package": "com.ecolithswap.app",
         "versionCode": 1,
         "permissions": [
           "CAMERA",
           "ACCESS_FINE_LOCATION",
           "ACCESS_COARSE_LOCATION",
           "SEND_SMS",
           "INTERNET"
         ],
         "config": {
           "googleMaps": {
             "apiKey": "your-android-maps-key"
           }
         }
       }
     }
   }
   ```

2. **Build APK**
   ```bash
   # Install EAS CLI
   npm install -g @expo/eas-cli
   
   # Configure build
   eas build:configure
   
   # Build for Android
   eas build --platform android --profile production
   ```

### iOS Configuration

1. **Update `app.json`**
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.ecolithswap.app",
         "buildNumber": "1",
         "config": {
           "googleMapsApiKey": "your-ios-maps-key"
         },
         "infoPlist": {
           "NSLocationWhenInUseUsageDescription": "EcolithSwap needs location access to find nearby battery swap stations",
           "NSCameraUsageDescription": "EcolithSwap needs camera access to scan QR codes for battery swaps"
         }
       }
     }
   }
   ```

2. **Build IPA**
   ```bash
   # Build for iOS
   eas build --platform ios --profile production
   ```

## 🚀 Deployment Steps

### 1. Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] API endpoints tested
- [ ] App icons and splash screens added
- [ ] Push notification certificates configured
- [ ] Privacy policy and terms of service updated
- [ ] App store listings prepared

### 2. Android Deployment

1. **Google Play Console Setup**
   ```bash
   # Create app in Google Play Console
   # Upload signed APK/AAB
   # Configure app listing and screenshots
   # Set up pricing and distribution
   ```

2. **Internal Testing**
   ```bash
   # Upload to internal testing track
   # Add test users
   # Conduct thorough testing
   ```

3. **Production Release**
   ```bash
   # Upload final build to production track
   # Configure staged rollout (e.g., 5% -> 20% -> 50% -> 100%)
   # Monitor crash reports and user feedback
   ```

### 3. iOS Deployment

1. **App Store Connect Setup**
   ```bash
   # Create app in App Store Connect
   # Upload build via Xcode or Application Loader
   # Configure app metadata and screenshots
   ```

2. **TestFlight Beta**
   ```bash
   # Upload beta build to TestFlight
   # Add beta testers
   # Collect feedback and fix issues
   ```

3. **App Store Release**
   ```bash
   # Submit for App Store review
   # Respond to any review feedback
   # Release to App Store upon approval
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Expo
        uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Android
        run: eas build --platform android --non-interactive
  
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Expo
        uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build iOS
        run: eas build --platform ios --non-interactive
```

## 📊 Monitoring and Analytics

### 1. Error Tracking

```bash
# Install Sentry for error tracking
npm install @sentry/react-native

# Configure in App.js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
});
```

### 2. Analytics

```bash
# Install analytics
npm install @react-native-firebase/analytics

# Track key events
analytics().logEvent('battery_swap_initiated');
analytics().logEvent('plastic_waste_logged');
```

### 3. Performance Monitoring

```bash
# Install performance monitoring
npm install @react-native-firebase/perf

# Monitor app performance
perf().newTrace('app_start');
```

## 🔒 Security Considerations

### 1. API Security
- Use HTTPS for all API calls
- Implement rate limiting
- Validate all inputs
- Use proper authentication tokens

### 2. Data Protection
- Encrypt sensitive data at rest
- Use secure storage for tokens
- Implement proper session management
- Follow GDPR compliance for user data

### 3. App Security
- Enable ProGuard for Android builds
- Use certificate pinning for API calls
- Implement biometric authentication
- Regular security audits

## 🎯 Performance Optimization

### 1. Bundle Size Optimization
```bash
# Analyze bundle size
npx react-native-bundle-visualizer

# Remove unused dependencies
npm run analyze-deps
```

### 2. Image Optimization
```bash
# Optimize images
npm install -g imagemin-cli
imagemin assets/**/*.{jpg,png} --out-dir=assets/optimized
```

### 3. Code Splitting
```javascript
// Implement lazy loading for screens
const HomeScreen = React.lazy(() => import('./screens/HomeScreen'));
```

## 📱 Device Testing

### Test Devices Matrix
- **Low-end Android**: Samsung Galaxy A10, Tecno Spark series
- **Mid-range Android**: Samsung Galaxy A50, Xiaomi Redmi Note series
- **High-end Android**: Samsung Galaxy S series, Google Pixel
- **iOS**: iPhone 8, iPhone 12, iPhone 13

### Testing Checklist
- [ ] App performance on low-end devices
- [ ] Offline functionality
- [ ] GPS accuracy in Kenya
- [ ] M-Pesa payment flow
- [ ] SMS fallback functionality
- [ ] Multi-language support

## 🚨 Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   ```bash
   # Clear caches
   expo start -c
   npm start -- --reset-cache
   ```

2. **Android Signing Issues**
   ```bash
   # Generate new keystore
   keytool -genkeypair -v -keystore ecolithswap.keystore -alias ecolithswap
   ```

3. **iOS Certificate Issues**
   ```bash
   # Update certificates in Xcode
   # Check provisioning profiles
   ```

## 📞 Support and Maintenance

### 1. Update Strategy
- **Critical Updates**: Same-day deployment
- **Security Updates**: Within 24 hours
- **Feature Updates**: Bi-weekly releases
- **Major Updates**: Monthly releases

### 2. Monitoring
- **Crash Reports**: Daily review
- **Performance Metrics**: Weekly analysis
- **User Feedback**: Continuous monitoring
- **App Store Reviews**: Daily response

### 3. Backup and Recovery
- **Database Backups**: Daily automated backups
- **Code Repository**: Multiple git remotes
- **Environment Configs**: Secure version control

## 📋 Post-Deployment Checklist

- [ ] App successfully deployed to app stores
- [ ] All features working in production
- [ ] Payment processing functional
- [ ] Analytics and monitoring active
- [ ] Support channels operational
- [ ] User documentation updated
- [ ] Team trained on production procedures

---

**For deployment support, contact the development team or refer to the main README.md**
