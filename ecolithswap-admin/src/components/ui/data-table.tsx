import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Button } from './button'
import { Checkbox } from './checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Input } from './input'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from 'lucide-react'
import { PaginationMeta } from '../../types'

export interface Column<T> {
  key: keyof T | 'actions' | 'select'
  header: string
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pagination?: PaginationMeta
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void
  loading?: boolean
  selectable?: boolean
  selectedItems?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
  getItemId?: (item: T) => string
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  loading = false,
  selectable = false,
  selectedItems = new Set(),
  onSelectionChange,
  getItemId = (item) => item.id,
  emptyMessage = 'No data available',
  className = '',
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const handleSort = (column: keyof T) => {
    if (!onSort) return

    const newDirection = 
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    
    setSortColumn(column)
    setSortDirection(newDirection)
    onSort(column, newDirection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return

    if (checked) {
      const allIds = new Set(data.map(getItemId))
      onSelectionChange(allIds)
    } else {
      onSelectionChange(new Set())
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (!onSelectionChange) return

    const newSelection = new Set(selectedItems)
    if (checked) {
      newSelection.add(itemId)
    } else {
      newSelection.delete(itemId)
    }
    onSelectionChange(newSelection)
  }

  const isAllSelected = data.length > 0 && data.every(item => selectedItems.has(getItemId(item)))
  const isIndeterminate = selectedItems.size > 0 && !isAllSelected

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={`${column.width || ''} ${
                    column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key as keyof T)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ArrowUpIcon
                          className={`h-3 w-3 ${
                            sortColumn === column.key && sortDirection === 'asc'
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <ArrowDownIcon
                          className={`h-3 w-3 -mt-1 ${
                            sortColumn === column.key && sortDirection === 'desc'
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const itemId = getItemId(item)
                return (
                  <TableRow key={itemId}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(itemId)}
                          onCheckedChange={(checked) => handleSelectItem(itemId, checked as boolean)}
                          aria-label={`Select ${itemId}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        {column.cell
                          ? column.cell(item)
                          : column.key === 'select' || column.key === 'actions'
                          ? null
                          : String(item[column.key] || '-')
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              {selectedItems.size > 0 && (
                <span className="mr-2">
                  {selectedItems.size} of {pagination.total} row(s) selected
                </span>
              )}
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </p>
          </div>

          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${pagination.limit}`}
                onValueChange={(value) => onPageSizeChange?.(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pagination.limit} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => onPageChange?.(1)}
                  disabled={pagination.page === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => onPageChange?.(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}