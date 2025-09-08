# EcolithSwap Mobile App

EcolithSwap is a comprehensive React Native mobile application for battery swapping, charging, and plastic waste recycling in Kenya. Built specifically for the African market with features optimized for low-end devices and intermittent connectivity.

## 🌟 Features

### Core Functionality
- **Battery Swapping**: QR code scanning for seamless battery rental and returns
- **Station Finder**: GPS-based location services with map and list views
- **Plastic Waste Tracking**: Log plastic waste for eco points and environmental impact
- **Impact Dashboard**: Track CO₂ savings, money saved, and plastic recycled
- **Offline Support**: Full offline functionality with automatic sync when connected
- **M-Pesa Integration**: Native Kenyan payment processing

### User Experience
- **Mobile-First Design**: Optimized for field users and boda boda riders
- **Low-Bandwidth**: Lightweight design that works on 2G/3G networks
- **Multi-Language**: English and Kiswahili support
- **Accessibility**: Works on low-end Android devices
- **SMS Fallback**: Support for areas with poor internet connectivity

## 📱 Screenshots

*Add screenshots of your app here once built*

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or later)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EcolithSwap
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   - Supabase project URL and API key
   - Google Maps API key (optional)
   - M-Pesa credentials (for production)

4. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

### Running on Device/Emulator

**Android:**
```bash
npm run android
# or
expo start --android
```

**iOS:**
```bash
npm run ios
# or
expo start --ios
```

**Web (for testing):**
```bash
npm run web
# or
expo start --web
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env`
3. Run the database schema (see `src/services/supabase.js` for SQL)

### Database Schema

The app requires these Supabase tables:

```sql
-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  phone TEXT,
  location TEXT,
  total_swaps INTEGER DEFAULT 0,
  plastic_recycled DECIMAL DEFAULT 0,
  co2_saved DECIMAL DEFAULT 0,
  money_saved DECIMAL DEFAULT 0,
  current_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battery swap stations
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  station_type TEXT NOT NULL CHECK (station_type IN ('swap', 'charge', 'both')),
  available_batteries INTEGER DEFAULT 0,
  total_slots INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  accepts_plastic BOOLEAN DEFAULT true,
  self_service BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battery rentals
CREATE TABLE battery_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  station_id UUID REFERENCES stations(id),
  battery_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  cost DECIMAL,
  payment_status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plastic waste logs
CREATE TABLE plastic_waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  station_id UUID REFERENCES stations(id),
  weight_kg DECIMAL NOT NULL,
  points_earned INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  rental_id UUID REFERENCES battery_rentals(id),
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'KES',
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### M-Pesa Integration

For M-Pesa integration in production:

1. Register for Safaricom Daraja API
2. Get your Consumer Key and Consumer Secret
3. Configure business short code and passkey
4. Update environment variables

## 📁 Project Structure

```
EcolithSwap/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── navigation/         # Navigation configuration
│   ├── screens/           # App screens/pages
│   ├── services/          # API and business logic
│   ├── utils/            # Utilities and helpers
│   └── types/            # TypeScript types (if using TS)
├── assets/               # Images, fonts, icons
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── README.md           # This file
```

## 🔌 Key Services

### Battery Service (`src/services/batteryService.js`)
- Battery swap initiation and completion
- Rental timer calculations
- User statistics tracking

### Station Service (`src/services/stationService.js`)
- Station location and availability
- GPS distance calculations
- Station search and filtering

### Waste Service (`src/services/wasteService.js`)
- Plastic waste logging
- Eco points calculation
- Environmental impact tracking

### Offline Service (`src/services/offline.js`)
- Offline data storage
- Automatic sync when online
- Pending action queue

## 📱 App Screens

1. **Home**: Dashboard with quick actions and active rental status
2. **Station Finder**: Map and list of nearby stations
3. **QR Scanner**: Camera-based QR code scanning
4. **Swap/Charge**: Battery rental management
5. **Plastic Waste**: Waste logging and points tracking
6. **Impact**: Environmental impact visualization
7. **History**: Activity and transaction history
8. **Support**: Help, FAQ, and contact options

## 🌍 Offline Functionality

The app is designed to work in areas with poor connectivity:

- **Local Storage**: SQLite database for offline data
- **Action Queue**: Pending actions synced when online
- **SMS Fallback**: Critical operations via SMS
- **Cached Data**: Stations and user data cached locally

## 🔒 Security Features

- **Supabase Auth**: Secure user authentication
- **Encrypted Storage**: Sensitive data encryption
- **API Security**: Row-level security policies
- **Payment Security**: No sensitive payment data stored

## 🚀 Deployment

### Android APK Build

```bash
expo build:android
```

### iOS Build

```bash
expo build:ios
```

### Over-the-Air Updates

```bash
expo publish
```

## 🧪 Testing

Run tests with:
```bash
npm test
```

For end-to-end testing:
```bash
npm run test:e2e
```

## 📊 Performance Optimization

- **Image Optimization**: Compressed images for faster loading
- **Code Splitting**: Lazy loading of screens
- **Memory Management**: Efficient component lifecycle
- **Network Optimization**: Request batching and caching

## 🌐 Localization

The app supports multiple languages:
- English (default)
- Kiswahili (Swahili)

Add new languages in `src/locales/`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 Requirements

### Minimum Device Requirements
- **Android**: API level 21 (Android 5.0) or higher
- **iOS**: iOS 11.0 or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 100MB available space

### Network Requirements
- **2G/3G/4G**: App optimized for low-bandwidth
- **Offline**: Core features work without internet
- **SMS**: Fallback support for critical operations

## 🆘 Troubleshooting

### Common Issues

**Metro bundler errors:**
```bash
npx react-native start --reset-cache
```

**Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
```

**iOS build issues:**
```bash
cd ios && pod install && cd ..
```

**Camera permissions:**
Ensure camera permissions are granted in device settings.

### Support

- **Documentation**: Check this README
- **Issues**: Open GitHub issues for bugs
- **Community**: Join our Discord/Slack community
- **Email**: support@ecolithswap.co.ke

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ecolith Africa Solutions** - For the vision and requirements
- **Safaricom M-Pesa** - For payment infrastructure
- **Supabase** - For backend services
- **Expo** - For React Native development platform
- **Open Source Community** - For the amazing libraries used

## 📞 Contact

- **Website**: [ecolithswap.co.ke](https://ecolithswap.co.ke)
- **Email**: info@ecolithswap.co.ke
- **Phone**: +254 700 000 000
- **Address**: Nairobi, Kenya

---

**Built with ❤️ for sustainable mobility in Africa**
