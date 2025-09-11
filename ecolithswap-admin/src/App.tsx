import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/query-client'
import { useAuthStore } from './stores/auth-store'
import { AppLayout } from './components/layout/app-layout'

// Page Imports
import { LoginPage } from './pages/auth/login'
import { DashboardPage } from './pages/dashboard'
import { BatteryListPage } from './pages/batteries/battery-list'
import { MaintenanceListPage } from './pages/batteries/maintenance-list'
import { StationListPage } from './pages/stations/station-list'
import { CustomerListPage } from './pages/customers/customer-list'
import { TicketListPage } from './pages/customers/ticket-list'
import { TicketDetailsPage } from './pages/customers/ticket-details'
import { FinancialOverviewPage } from './pages/financial/financial-overview'
import { TransactionListPage } from './pages/transactions/transaction-list'
import { RevenueReportsPage } from './pages/financial/revenue-reports-page'
import { PricingManagementPage } from './pages/financial/pricing-management-page'
import { EnvironmentalImpactPage } from './pages/environmental/environmental-impact'
import { WasteSubmissionsPage } from './pages/environmental/waste-submissions-page'
import { LeaderboardPage } from './pages/environmental/leaderboard-page'
import { ReportsDashboardPage } from './pages/reports/reports-dashboard'
import { UsageAnalyticsPage } from './pages/analytics/usage-analytics-page'
import { UserAnalyticsPage } from './pages/analytics/user-analytics-page'
import { GeographicAnalysisPage } from './pages/analytics/geographic-analysis-page'
import { SettingsPage } from './pages/settings/settings-page'
import { UserManagementPage } from './pages/settings/user-management-page'
import { ApiKeysPage } from './pages/settings/api-keys-page'
import { BillingPage } from './pages/settings/billing-page'
import { AuditLogsPage } from './pages/settings/audit-logs-page'

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2E7D32]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout title="Dashboard">
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      
                      {/* Battery Management */}
                      <Route path="/batteries" element={<BatteryListPage />} />
                      <Route path="/batteries/maintenance" element={<MaintenanceListPage />} />
                      <Route path="/batteries/analytics" element={<div>Battery Analytics Page</div>} />
                      
                      {/* Station Management */}
                      <Route path="/stations" element={<StationListPage />} />
                      <Route path="/stations/add" element={<div>Add Station Page</div>} />
                      <Route path="/stations/map" element={<div>Station Map Page</div>} />
                      
                      {/* Customer Management */}
                      <Route path="/customers" element={<CustomerListPage />} />
                      <Route path="/customers/support" element={<TicketListPage />} />
                      <Route path="/customers/support/:id" element={<TicketDetailsPage />} />
                      
                      {/* Financial */}
                      <Route path="/financial/*" element={<FinancialOverviewPage />} />
                      <Route path="/financial/transactions" element={<TransactionListPage />} />
                      <Route path="/financial/revenue" element={<RevenueReportsPage />} />
                      <Route path="/financial/pricing" element={<PricingManagementPage />} />
                      
                      {/* Environmental Impact */}
                      <Route path="/environmental" element={<EnvironmentalImpactPage />} />
                      <Route path="/environmental/submissions" element={<WasteSubmissionsPage />} />
                      <Route path="/environmental/leaderboard" element={<LeaderboardPage />} />
                      
                      {/* Analytics & Reports */}
                      <Route path="/analytics" element={<ReportsDashboardPage />} />
                      <Route path="/analytics/usage" element={<UsageAnalyticsPage />} />
                      <Route path="/analytics/users" element={<UserAnalyticsPage />} />
                      <Route path="/analytics/geo" element={<GeographicAnalysisPage />} />
                      
                      {/* Settings */}
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/settings/users" element={<UserManagementPage />} />
                      <Route path="/settings/api-keys" element={<ApiKeysPage />} />
                      <Route path="/settings/billing" element={<BillingPage />} />
                      <Route path="/settings/audit-logs" element={<AuditLogsPage />} />
                      
                      {/* 404 */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
      
      {/* React Query Devtools */}
      <ReactQueryDevtools initialIsOpen={false} />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            style: {
              border: '1px solid #22c55e',
            },
          },
          error: {
            style: {
              border: '1px solid #ef4444',
            },
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App
