import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import {
  Recycle,
  Leaf,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  TreePine,
  Droplets,
  Zap,
} from 'lucide-react'
import { formatNumber } from '../../lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Sample data
const co2SavingsData = [
  { month: 'Jan', co2Saved: 2340, plasticRecycled: 890, swaps: 12450 },
  { month: 'Feb', co2Saved: 2680, plasticRecycled: 1020, swaps: 14230 },
  { month: 'Mar', co2Saved: 2450, plasticRecycled: 950, swaps: 13120 },
  { month: 'Apr', co2Saved: 3120, plasticRecycled: 1180, swaps: 16890 },
  { month: 'May', co2Saved: 2890, plasticRecycled: 1090, swaps: 15670 },
  { month: 'Jun', co2Saved: 3450, plasticRecycled: 1340, swaps: 18920 },
  { month: 'Jul', co2Saved: 3680, plasticRecycled: 1420, swaps: 20150 },
]

const weeklyImpactData = [
  { day: 'Mon', co2: 145, plastic: 58, energy: 234 },
  { day: 'Tue', co2: 167, plastic: 63, energy: 267 },
  { day: 'Wed', co2: 134, plastic: 52, energy: 213 },
  { day: 'Thu', co2: 189, plastic: 71, energy: 289 },
  { day: 'Fri', co2: 203, plastic: 78, energy: 312 },
  { day: 'Sat', co2: 234, plastic: 89, energy: 356 },
  { day: 'Sun', co2: 178, plastic: 67, energy: 278 },
]

export function EnvironmentalImpactPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Environmental Impact</h2>
          <p className="text-gray-600 mt-2">
            Track the positive environmental impact of EcolithSwap
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
            Impact Report
          </Button>
        </div>
      </div>

      {/* Impact Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">CO₂ Saved</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(28640)} kg</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+11.2% this month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Recycle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Plastic Recycled</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(11250)} kg</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+8.5% this month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Energy Saved</p>
                <p className="text-2xl font-bold text-yellow-600">{formatNumber(145890)} kWh</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+13.7% this month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TreePine className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trees Equivalent</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(1247)}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500">CO₂ absorption equivalent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Impact Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Environmental Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={co2SavingsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'co2Saved' ? `${value} kg CO₂` :
                    name === 'plasticRecycled' ? `${value} kg` : value,
                    name === 'co2Saved' ? 'CO₂ Saved' :
                    name === 'plasticRecycled' ? 'Plastic Recycled' : 'Battery Swaps'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="co2Saved"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="plasticRecycled"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Impact Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyImpactData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'co2' ? `${value} kg CO₂` :
                    name === 'plastic' ? `${value} kg` :
                    `${value} kWh`,
                    name === 'co2' ? 'CO₂ Saved' :
                    name === 'plastic' ? 'Plastic Recycled' : 'Energy Saved'
                  ]}
                />
                <Bar dataKey="co2" fill="#22c55e" name="CO₂ Saved" />
                <Bar dataKey="plastic" fill="#3b82f6" name="Plastic Recycled" />
                <Bar dataKey="energy" fill="#f59e0b" name="Energy Saved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Leaf className="h-5 w-5 mr-2 text-green-600" />
              Carbon Footprint Reduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total CO₂ Saved</span>
                <span className="font-semibold">{formatNumber(28640)} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Equivalent Cars Off Road</span>
                <span className="font-semibold">{formatNumber(62)} cars/year</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tree Planting Equivalent</span>
                <span className="font-semibold">{formatNumber(1247)} trees</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Recycle className="h-5 w-5 mr-2 text-blue-600" />
              Plastic Waste Reduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Plastic Recycled</span>
                <span className="font-semibold">{formatNumber(11250)} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bottles Diverted</span>
                <span className="font-semibold">{formatNumber(562500)} bottles</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ocean Plastic Prevented</span>
                <span className="font-semibold">{formatNumber(3375)} kg</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              Energy Conservation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Energy Saved</span>
                <span className="font-semibold">{formatNumber(145890)} kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Homes Powered</span>
                <span className="font-semibold">{formatNumber(234)} homes/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Coal Avoided</span>
                <span className="font-semibold">{formatNumber(73)} tons</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
