import React from 'react'
import { Button } from './button'
import { PlusIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  children?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  children,
}) => {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {children}
        {action && (
          <Button onClick={action.onClick} className="flex items-center space-x-2">
            {action.icon || <PlusIcon className="h-4 w-4" />}
            <span>{action.label}</span>
          </Button>
        )}
      </div>
    </div>
  )
}