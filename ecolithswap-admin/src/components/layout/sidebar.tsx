import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Battery,
  MapPin,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Recycle,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth-store'
import { Button } from '../ui/button'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Battery Management',
    href: '/batteries',
    icon: Battery,
    children: [
      { name: 'Inventory', href: '/batteries' },
      { name: 'Maintenance', href: '/batteries/maintenance' },
      { name: 'Analytics', href: '/batteries/analytics' },
    ],
  },
  {
    name: 'Station Management',
    href: '/stations',
    icon: MapPin,
    children: [
      { name: 'All Stations', href: '/stations' },
      { name: 'Add Station', href: '/stations/add' },
      { name: 'Map View', href: '/stations/map' },
    ],
  },
  {
    name: 'Customer Management',
    href: '/customers',
    icon: Users,
    children: [
      { name: 'All Customers', href: '/customers' },
      { name: 'Support Tickets', href: '/customers/support' },
    ],
  },
  {
    name: 'Financial',
    href: '/financial',
    icon: CreditCard,
    children: [
      { name: 'Transactions', href: '/financial/transactions' },
      { name: 'Revenue Reports', href: '/financial/revenue' },
      { name: 'Pricing', href: '/financial/pricing' },
    ],
  },
  {
    name: 'Environmental Impact',
    href: '/environmental',
    icon: Recycle,
  },
  {
    name: 'Analytics & Reports',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { logout, user } = useAuthStore()

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#2E7D32] rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-xl text-gray-900">EcolithSwap</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="w-8 h-8"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isItemActive = isActive(item.href)
          return (
            <div key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isItemActive
                    ? 'bg-[#2E7D32] text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    collapsed && 'mr-0'
                  )}
                />
                {!collapsed && item.name}
              </Link>
              
              {/* Sub-navigation */}
              {!collapsed && item.children && isItemActive && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      to={child.href}
                      className={cn(
                        'block px-3 py-1 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50',
                        location.pathname === child.href && 'text-[#2E7D32] font-medium'
                      )}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={() => logout()}
          className={cn(
            'w-full justify-start',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className={cn('h-4 w-4', !collapsed && 'mr-2')} />
          {!collapsed && 'Sign Out'}
        </Button>
      </div>
    </div>
  )
}
