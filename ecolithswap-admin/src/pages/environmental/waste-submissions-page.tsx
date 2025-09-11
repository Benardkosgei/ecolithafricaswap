import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentalAPI } from '../../lib/api';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { ColumnDef } from '@tanstack/react-table';

interface WasteSubmission {
  id: string;
  userId: string;
  wasteType: 'PET' | 'HDPE' | 'OTHER';
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export function WasteSubmissionsPage() {
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery<WasteSubmission[]>({
    queryKey: ['wasteSubmissions'],
    queryFn: () => environmentalAPI.getWasteSubmissions().then(res => res.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'APPROVED' | 'REJECTED' }) => 
      environmentalAPI.updateSubmissionStatus(id, status),
    onSuccess: () => {
      toast.success('Submission status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['wasteSubmissions'] });
    },
    onError: () => {
      toast.error('Failed to update submission status.');
    },
  });

  const columns: ColumnDef<WasteSubmission>[] = [
    { accessorKey: 'userId', header: 'User ID' },
    { 
      accessorKey: 'wasteType', 
      header: 'Waste Type', 
      cell: ({ row }) => <Badge variant="secondary">{row.original.wasteType}</Badge> 
    },
    { accessorKey: 'quantity', header: 'Quantity (kg)' },
    { 
      accessorKey: 'submittedAt', 
      header: 'Submitted At', 
      cell: ({ row }) => new Date(row.original.submittedAt).toLocaleDateString()
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const variant = {
          PENDING: 'default',
          APPROVED: 'success',
          REJECTED: 'destructive'
        }[row.original.status];
        return <Badge variant={variant as any}>{row.original.status}</Badge>;
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const submission = row.original;
        if (submission.status !== 'PENDING') return null;

        return (
          <div className="flex space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline-success">Approve</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will approve the submission and award EcoCredits to the user.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => mutation.mutate({ id: submission.id, status: 'APPROVED' })}>
                    Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">Reject</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reject the submission. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => mutation.mutate({ id: submission.id, status: 'REJECTED' })}>
                    Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Waste Submissions</h2>
      <DataTable
        columns={columns}
        data={submissions || []}
        isLoading={isLoading}
        filterColumn='userId'
        filterPlaceholder='Filter by user...'
      />
    </div>
  );
}
