import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/query-client'
import { useAuthStore } from './stores/auth-store'
import { AppLayout } from './components/layout/app-layout'
import { LoginPage } from './pages/auth/login'
import { DashboardPage } from './pages/dashboard'
import { BatteryListPage } from './pages/batteries/battery-list'
import { StationListPage } from './pages/stations/station-list'
import { CustomerListPage } from './pages/customers/customer-list'
import { FinancialOverviewPage } from './pages/financial/financial-overview'
import { EnvironmentalImpactPage } from './pages/environmental/environmental-impact'

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
                      <Route path="/batteries/maintenance" element={<div>Battery Maintenance Page</div>} />
                      <Route path="/batteries/analytics" element={<div>Battery Analytics Page</div>} />
                      
                      {/* Station Management */}
                      <Route path="/stations" element={<StationListPage />} />
                      <Route path="/stations/add" element={<div>Add Station Page</div>} />
                      <Route path="/stations/map" element={<div>Station Map Page</div>} />
                      
                      {/* Customer Management */}
                      <Route path="/customers" element={<CustomerListPage />} />
                      <Route path="/customers/support" element={<div>Support Tickets Page</div>} />
                      
                      {/* Financial */}
                      <Route path="/financial/*" element={<FinancialOverviewPage />} />
                      <Route path="/financial/transactions" element={<div>Transactions Page</div>} />
                      <Route path="/financial/revenue" element={<div>Revenue Reports Page</div>} />
                      <Route path="/financial/pricing" element={<div>Pricing Management Page</div>} />
                      
                      {/* Environmental Impact */}
                      <Route path="/environmental" element={<EnvironmentalImpactPage />} />
                      
                      {/* Analytics & Reports */}
                      <Route path="/analytics" element={<div>Analytics & Reports Page</div>} />
                      
                      {/* Settings */}
                      <Route path="/settings" element={<div>Settings Page</div>} />
                      
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
