# EcolithSwap Admin Dashboard

A comprehensive admin dashboard for managing the EcolithSwap battery swapping and plastic waste recycling ecosystem.

## Features

### 🔋 Battery Management
- Real-time battery inventory tracking
- Individual battery health and status monitoring
- Battery lifecycle management and maintenance scheduling
- Performance analytics and reporting

### 🏢 Station Management
- Complete station monitoring and control
- Real-time battery availability tracking
- Station performance metrics and analytics
- Geographic coverage and map visualization

### 👥 Customer Management
- Comprehensive customer database and profiles
- Usage patterns and behavior analytics
- Support ticket management system
- Loyalty program and points tracking

### 💰 Financial Management
- Transaction monitoring and reporting
- Revenue tracking and analytics
- Payment method distribution analysis
- Financial performance dashboards

### 🌱 Environmental Impact
- CO₂ savings tracking and visualization
- Plastic waste collection and recycling metrics
- Environmental impact reporting
- Sustainability KPIs and goals

### 📊 Analytics & Reporting
- Real-time dashboard with key metrics
- Custom report generation
- Data export capabilities (PDF, CSV, Excel)
- Performance benchmarking

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: Zustand + React Query
- **Charts**: Recharts
- **Backend**: Supabase (Database, Auth, Storage)
- **Styling**: Tailwind CSS with custom design system

## Design System

### Colors
- **Primary**: #2E7D32 (EcolithSwap Green)
- **Accent**: #00796B (Teal)
- **Success**: #4CAF50
- **Warning**: #FFC107
- **Error**: #D32F2F

### Typography
- **Font Family**: Inter (Google Fonts)
- **Hierarchy**: H1-H3 headings, body text, small text

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account and project

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Setup**:
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Development Server**:
   ```bash
   pnpm dev
   ```

4. **Build for Production**:
   ```bash
   pnpm build
   ```

### Demo Credentials

For testing purposes, use these demo credentials:
- **Email**: admin@ecolithswap.com
- **Password**: admin123

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── layout/           # Layout components
│   └── dashboard/        # Dashboard-specific components
├── pages/              # Page components
│   ├── auth/             # Authentication pages
│   ├── batteries/        # Battery management pages
│   ├── stations/         # Station management pages
│   ├── customers/        # Customer management pages
│   ├── financial/        # Financial pages
│   └── environmental/    # Environmental impact pages
├── lib/                # Utility functions and configurations
├── stores/             # State management (Zustand)
└── hooks/              # Custom React hooks
```

## Key Features Implemented

### Dashboard Overview
- Real-time KPI cards with trending indicators
- Interactive charts for swaps, revenue, and battery status
- Recent activity feed with real-time updates
- Station performance metrics

### Battery Management
- Comprehensive battery inventory with search and filtering
- Battery health and charge level indicators
- Status tracking (available, in-use, charging, maintenance)
- Maintenance scheduling and history

### Station Management
- Station status monitoring with real-time updates
- Battery availability tracking per station
- Performance metrics and efficiency ratings
- Geographic distribution and coverage analysis

### Customer Management
- Customer database with detailed profiles
- Subscription type and status tracking
- Loyalty points and rewards management
- Usage analytics and behavior patterns

### Financial Reporting
- Revenue tracking with multiple time periods
- Transaction monitoring and analysis
- Payment method distribution
- Financial performance dashboards

### Environmental Impact
- CO₂ savings calculation and visualization
- Plastic waste collection tracking
- Energy conservation metrics
- Environmental impact reporting

## Database Schema

The application uses Supabase with the following main tables:
- `admin_users` - Admin user accounts and permissions
- `stations` - Battery swap station information
- `batteries` - Individual battery tracking
- `customers` - Customer profiles and data
- `battery_swaps` - Swap transaction records
- `transactions` - Financial transaction data
- `plastic_waste_collections` - Plastic waste tracking
- `maintenance_logs` - Maintenance records
- `support_tickets` - Customer support system
- `system_analytics` - Analytics and KPI data

## Security Features

- Role-based access control (RBAC)
- Supabase Row Level Security (RLS)
- Protected routes with authentication
- Secure API communication
- Input validation and sanitization

## Performance Optimizations

- Code splitting by route
- Lazy loading of components
- React Query for efficient data fetching and caching
- Optimized bundle size with tree shaking
- Image optimization and lazy loading

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes
- Focus management

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Copyright © 2025 EcolithSwap. All rights reserved.

## Support

For support and questions, please contact the development team or refer to the internal documentation.
