import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@tanstack/react-query'
import { adminAPI } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { BarChart, Download, FileText, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const reportSchema = z.object({
  reportType: z.string().min(1, 'Report type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  format: z.enum(['csv', 'pdf']),
})

const reportOptions = {
  financial: [
    { value: 'revenue_summary', label: 'Revenue Summary' },
    { value: 'transaction_details', label: 'Transaction Details' },
    { value: 'refund_report', label: 'Refund Report' },
  ],
  usage: [
    { value: 'station_activity', label: 'Station Activity' },
    { value: 'battery_swap_history', label: 'Battery Swap History' },
    { value: 'user_engagement', label: 'User Engagement' },
  ],
  environmental: [
    { value: 'carbon_offset', label: 'Carbon Offset Report' },
    { value: 'plastic_recycling', label: 'Plastic Recycling Summary' },
  ],
  inventory: [
    { value: 'battery_health', label: 'Battery Health & Status' },
    { value: 'station_inventory', label: 'Station Inventory Levels' },
  ],
}

export function ReportsDashboardPage() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: '',
      startDate: '',
      endDate: '',
      format: 'csv',
    },
  })

  const selectedCategory = watch('reportType').split('_')[0] as keyof typeof reportOptions

  const exportMutation = useMutation<Blob, Error, z.infer<typeof reportSchema>>({
    mutationFn: (variables) =>
      adminAPI.exportData(variables.reportType, { 
        startDate: variables.startDate, 
        endDate: variables.endDate, 
        format: variables.format 
      }).then((res: any) => res.data),
    onSuccess: (data, variables) => {
      const filename = `${variables.reportType}_${variables.startDate}_to_${variables.endDate}.${variables.format}`
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Report generated and download started!')
    },
    onError: (error) => {
      toast.error(`Failed to generate report: ${error.message}`)
    },
  })

  const onSubmit = (data: z.infer<typeof reportSchema>) => {
    exportMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reports Dashboard</h2>
          <p className="text-gray-600 mt-2">
            Generate and download system reports.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Generate a New Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Report Type */}
              <div>
                <label className="font-medium">Report Type</label>
                <Controller
                  name="reportType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a report" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(reportOptions).map(([category, options]) => (
                          <React.Fragment key={category}>
                            <p className="font-semibold p-2 text-sm capitalize">{category} Reports</p>
                            {options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.reportType && (
                  <p className="text-sm text-red-600 mt-1">{errors.reportType.message}</p>
                )}
              </div>

              {/* Date Range */}
              <div>
                <label className="font-medium">Start Date</label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => <Input type="date" {...field} />}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="font-medium">End Date</label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => <Input type="date" {...field} />}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
                )}
              </div>

              {/* Format */}
              <div>
                <label className="font-medium">Format</label>
                <Controller
                  name="format"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={exportMutation.isPending}>
                {exportMutation.isPending ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Recently Generated Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <p>No reports have been generated recently.</p>
            <p className="text-sm">Generated reports will appear here for quick access.</p>
          </div>
          {/* This section can be implemented to list past reports if an API for that exists */}
        </CardContent>
      </Card>
    </div>
  )
}
