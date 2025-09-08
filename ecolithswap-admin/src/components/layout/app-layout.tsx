import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { cn } from '../../lib/utils'

interface AppLayoutProps {
  title?: string
  children?: React.ReactNode
}

export function AppLayout({ title = 'Dashboard', children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
