import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Download,
  Filter,
  Calendar,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '../../lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// Sample data
const revenueData = [
  { month: 'Jan', revenue: 45890, transactions: 1245, avgTransaction: 36.85 },
  { month: 'Feb', revenue: 52340, transactions: 1456, avgTransaction: 35.94 },
  { month: 'Mar', revenue: 48920, transactions: 1367, avgTransaction: 35.79 },
  { month: 'Apr', revenue: 61250, transactions: 1698, avgTransaction: 36.07 },
  { month: 'May', revenue: 58730, transactions: 1623, avgTransaction: 36.18 },
  { month: 'Jun', revenue: 67890, transactions: 1834, avgTransaction: 37.02 },
  { month: 'Jul', revenue: 71450, transactions: 1923, avgTransaction: 37.15 },
]

const paymentMethodData = [
  { name: 'M-Pesa', value: 45, color: '#2E7D32' },
  { name: 'Credit Card', value: 35, color: '#00796B' },
  { name: 'Debit Card', value: 15, color: '#FFC107' },
  { name: 'Cash', value: 5, color: '#D32F2F' },
]

const dailyRevenueData = [
  { day: 'Mon', revenue: 8450, swaps: 234 },
  { day: 'Tue', revenue: 9230, swaps: 267 },
  { day: 'Wed', revenue: 7890, swaps: 213 },
  { day: 'Thu', revenue: 10340, swaps: 289 },
  { day: 'Fri', revenue: 11250, swaps: 312 },
  { day: 'Sat', revenue: 12890, swaps: 356 },
  { day: 'Sun', revenue: 9870, swaps: 278 },
]

export function FinancialOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Financial Overview</h2>
          <p className="text-gray-600 mt-2">
            Monitor revenue, transactions, and financial performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-[#2E7D32]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(245890)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+15.3% from last month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-[#2E7D32]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{formatNumber(8547)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+8.7% from last month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Banknote className="h-8 w-8 text-[#2E7D32]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-bold">{formatCurrency(36.87)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+2.1% from last month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-[#2E7D32]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                <p className="text-2xl font-bold">15.3%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">vs 12.8% last month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2E7D32"
                  fill="#2E7D32"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue & Swaps</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value as number) : value,
                  name === 'revenue' ? 'Revenue' : 'Swaps'
                ]}
              />
              <Bar yAxisId="left" dataKey="revenue" fill="#2E7D32" name="Revenue" />
              <Bar yAxisId="right" dataKey="swaps" fill="#00796B" name="Swaps" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
