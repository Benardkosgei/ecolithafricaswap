import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Battery, Fuel, Users, DollarSign, Recycle, BarChart3, Settings, ChevronDown, ChevronRight, Bell } from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
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
    icon: Fuel,
    children: [
      { name: 'Station List', href: '/stations' },
      { name: 'Station Map', href: '/stations/map' },
      { name: 'Heatmap', href: '/stations/heatmap' },
    ],
  },
  {
    name: 'User Management',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Financials',
    icon: DollarSign,
    children: [
      { name: 'Transactions', href: '/transactions' },
      { name: 'Revenue', href: '/revenue' },
    ],
  },
  {
    name: 'Waste Management',
    href: '/waste',
    icon: Recycle,
  },
  {
    name: 'System Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

const NavItem = ({ item }) => {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const isActive = item.href === pathname;
  const hasChildren = item.children && item.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  if (hasChildren) {
    return (
      <div>
        <div 
          onClick={handleToggle}
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
        >
          <div className="flex items-center">
            <item.icon className="h-5 w-5 mr-3" />
            <span>{item.name}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        {isOpen && (
          <div className="pl-8 mt-2 space-y-2">
            {item.children.map((child) => (
              <Link
                key={child.name}
                to={child.href}
                className={`flex items-center p-2 rounded-md ${pathname === child.href ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={`flex items-center p-2 rounded-md ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
    >
      <item.icon className="h-5 w-5 mr-3" />
      <span>{item.name}</span>
    </Link>
  );
};

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <div className="text-2xl font-bold mb-6">Ecolith Admin</div>
      <nav className="space-y-2">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>
    </aside>
  );
}
