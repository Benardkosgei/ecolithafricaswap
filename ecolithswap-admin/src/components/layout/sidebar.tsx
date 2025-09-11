import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Battery, ChargingStation, Users, DollarSign, Recycle, BarChart3, Settings, ChevronDown, ChevronRight } from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Battery Management',
    icon: Battery,
    children: [
      { name: 'Battery List', href: '/batteries' },
      { name: 'Maintenance', href: '/batteries/maintenance' },
      { name: 'Analytics', href: '/batteries/analytics' },
    ],
  },
  {
    name: 'Station Management',
    icon: ChargingStation,
    children: [
      { name: 'Station List', href: '/stations' },
      { name: 'Add Station', href: '/stations/add' },
      { name: 'Map View', href: '/stations/map' },
    ],
  },
  {
    name: 'Customer Management',
    icon: Users,
    children: [
      { name: 'Customer List', href: '/customers' },
      { name: 'Support Tickets', href: '/customers/support' },
    ],
  },
  {
    name: 'Financial',
    icon: DollarSign,
    children: [
      { name: 'Overview', href: '/financial' },
      { name: 'Transactions', href: '/financial/transactions' },
      { name: 'Revenue Reports', href: '/financial/revenue' },
      { name: 'Pricing', href: '/financial/pricing' },
    ],
  },
  {
    name: 'Environmental Impact',
    icon: Recycle,
    children: [
        { name: 'Overview', href: '/environmental' },
        { name: 'Waste Submissions', href: '/environmental/submissions' },
        { name: 'Leaderboard', href: '/environmental/leaderboard' },
    ],
  },
  {
    name: 'Analytics & Reports',
    icon: BarChart3,
    children: [
        { name: 'Dashboard', href: '/analytics' },
        { name: 'Usage Analytics', href: '/analytics/usage' },
        { name: 'User Analytics', href: '/analytics/users' },
        { name: 'Geographic Analysis', href: '/analytics/geo' },
    ]
  },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'General', href: '/settings' },
      { name: 'User Management', href: '/settings/users' },
      { name: 'API Keys', href: '/settings/api-keys' },
      { name: 'Billing', href: '/settings/billing' },
      { name: 'Audit Logs', href: '/settings/audit-logs' },
    ]
  },
];

const NavItem = ({ item }) => {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = React.useState(pathname.startsWith(item.children ? `/settings` : (item.href || 'a')));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-200 rounded-md"
        >
          <div className="flex items-center">
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="pl-8 py-2 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.name}
                to={child.href}
                className={`block px-4 py-2 text-sm rounded-md ${pathname === child.href ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } else {
    return (
      <Link
        to={item.href}
        className={`flex items-center px-4 py-2 text-gray-700 rounded-md ${pathname === item.href ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}>
        <item.icon className="h-5 w-5 mr-3" />
        {item.name}
      </Link>
    );
  }
};

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex items-center mb-8">
        <img src="/logo.png" alt="EcolithSwap Logo" className="h-8 w-auto" />
        <span className="text-xl font-bold ml-2 text-gray-800">EcolithSwap</span>
      </div>
      <nav className="space-y-2">
        {navigation.map((item) => <NavItem key={item.name} item={item} />)}
      </nav>
    </aside>
  );
}
