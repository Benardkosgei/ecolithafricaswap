import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { rentalsAPI, paymentsAPI, PaginationResponse, Customer } from '../../lib/api' // Assuming Customer is the user type
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Search,
  Filter,
  Download,
  ArrowRightLeft,
  CreditCard,
  Eye,
  FileText,
} from 'lucide-react'
import { formatDate, formatCurrency, getStatusColor } from '../../lib/utils'

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Mock interfaces for Rental and Payment - replace with actual imports
interface Rental {
  id: string;
  user: Customer;
  battery: { serialNumber: string };
  pickup_station: { name: string };
  return_station?: { name: string };
  status: string;
  rental_start_time: string;
  rental_end_time?: string;
}

interface Payment {
  id: string;
  user: Customer;
  amount: number;
  status: string;
  payment_method: string;
  transaction_date: string;
}

function SwapsTab() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data, isLoading } = useQuery<PaginationResponse<Rental>>({
    queryKey: ['rentals', page, debouncedSearchTerm, statusFilter],
    queryFn: () => rentalsAPI.getRentals({
      page,
      search: debouncedSearchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }).then(res => res.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search by user or battery..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {/* Add more filters as needed */}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Battery</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pickup Station</TableHead>
            <TableHead>Return Station</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
          ) : (
            data?.data.map((rental) => (
              <TableRow key={rental.id}>
                <TableCell>{rental.user.name}</TableCell>
                <TableCell>{rental.battery.serialNumber}</TableCell>
                <TableCell><Badge className={getStatusColor(rental.status)}>{rental.status}</Badge></TableCell>
                <TableCell>{rental.pickup_station.name}</TableCell>
                <TableCell>{rental.return_station?.name || 'N/A'}</TableCell>
                <TableCell>{formatDate(rental.rental_start_time)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
       <div className="flex justify-end items-center space-x-4 mt-6">
        <Button
          variant="outline"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {data?.pagination.totalPages ?? 1}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page === data?.pagination.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function PaymentsTab() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data, isLoading } = useQuery<PaginationResponse<Payment>>({
    queryKey: ['payments', page, debouncedSearchTerm, statusFilter],
    queryFn: () => paymentsAPI.getPayments({
      page,
      search: debouncedSearchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }).then(res => res.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search by user or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {/* Add more filters as needed */}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
          ) : (
            data?.data.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.user.name}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{payment.payment_method}</TableCell>
                <TableCell><Badge className={getStatusColor(payment.status)}>{payment.status}</Badge></TableCell>
                <TableCell>{formatDate(payment.transaction_date)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon"><FileText className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
       <div className="flex justify-end items-center space-x-4 mt-6">
        <Button
          variant="outline"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {data?.pagination.totalPages ?? 1}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page === data?.pagination.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export function TransactionListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-gray-600 mt-2">
            Browse and manage all swaps and payments.
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="swaps">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="swaps">
                <ArrowRightLeft className="h-4 w-4 mr-2" /> Swaps
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" /> Payments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="swaps" className="mt-4">
              <SwapsTab />
            </TabsContent>
            <TabsContent value="payments" className="mt-4">
              <PaymentsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
