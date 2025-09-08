import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Eye,
  Users,
  CreditCard,
  Award,
  MessageCircle,
} from 'lucide-react'
import { formatDate, formatCurrency } from '../../lib/utils'

interface CustomerData {
  id: string
  name: string
  email: string
  phone: string
  subscriptionType: string
  subscriptionStatus: string
  totalSwaps: number
  loyaltyPoints: number
  totalSpent: number
  registrationDate: string
  lastSwapDate: string
  isVerified: boolean
}

// Mock data - would come from API
const mockCustomers: CustomerData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    subscriptionType: 'premium',
    subscriptionStatus: 'active',
    totalSwaps: 156,
    loyaltyPoints: 2340,
    totalSpent: 468,
    registrationDate: '2024-08-15T10:30:00Z',
    lastSwapDate: '2025-02-01T14:22:00Z',
    isVerified: true,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 987-6543',
    subscriptionType: 'basic',
    subscriptionStatus: 'active',
    totalSwaps: 89,
    loyaltyPoints: 1245,
    totalSpent: 267,
    registrationDate: '2024-09-22T16:45:00Z',
    lastSwapDate: '2025-01-30T11:15:00Z',
    isVerified: true,
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '+1 (555) 456-7890',
    subscriptionType: 'premium',
    subscriptionStatus: 'expired',
    totalSwaps: 234,
    loyaltyPoints: 3567,
    totalSpent: 702,
    registrationDate: '2024-06-10T09:20:00Z',
    lastSwapDate: '2025-01-28T09:45:00Z',
    isVerified: false,
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '+1 (555) 234-5678',
    subscriptionType: 'basic',
    subscriptionStatus: 'active',
    totalSwaps: 45,
    loyaltyPoints: 675,
    totalSpent: 135,
    registrationDate: '2024-12-05T13:10:00Z',
    lastSwapDate: '2025-01-31T16:30:00Z',
    isVerified: true,
  },
]

export function CustomerListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch = customer.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || customer.subscriptionStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const getSubscriptionColor = (type: string) => {
    return type === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600 mt-2">
            Manage customer accounts and analyze usage patterns
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Support Tickets
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-[#2E7D32]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">12,547</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">10,234</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Premium</p>
                <p className="text-2xl font-bold text-purple-600">3,892</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Loyalty Points</p>
                <p className="text-2xl font-bold text-yellow-600">1,847</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Customers Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Swaps</TableHead>
                <TableHead>Loyalty Points</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Swap</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="flex items-center">
                        <div className="font-medium">{customer.name}</div>
                        {customer.isVerified && (
                          <div className="ml-2 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Joined {formatDate(customer.registrationDate)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSubscriptionColor(customer.subscriptionType)}>
                      {customer.subscriptionType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(customer.subscriptionStatus)}>
                      {customer.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {customer.totalSwaps}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1 text-yellow-500" />
                      {customer.loyaltyPoints}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                  <TableCell>
                    {formatDate(customer.lastSwapDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
