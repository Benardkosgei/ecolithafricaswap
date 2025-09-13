import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportAPI, SupportTicket } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertTriangle, Send, ArrowLeft, User, Clock } from 'lucide-react';
import { formatDate, getStatusColor } from '../../lib/utils';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [replyMessage, setReplyMessage] = React.useState('');

  const { data: ticket, isLoading, error } = useQuery<SupportTicket>({
    queryKey: ['ticket', id],
    queryFn: () => supportAPI.getTicket(id!).then(res => res.data),
    enabled: !!id,
  });

  const replyMutation = useMutation<SupportTicket, Error, string>({
    mutationFn: (message) => supportAPI.replyToTicket(id!, message),
    onSuccess: () => {
      toast.success('Reply sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setReplyMessage('');
    },
    onError: (error) => {
      toast.error(`Failed to send reply: ${error.message}`);
    },
  });

  const updateStatusMutation = useMutation<SupportTicket, Error, string>({
    mutationFn: (status) => supportAPI.updateTicketStatus(id!, status),
    onSuccess: () => {
      toast.success('Ticket status updated!');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleReply = () => {
    if (replyMessage.trim()) {
      replyMutation.mutate(replyMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Ticket</h3>
          <p className="text-gray-600">Could not load the details for this ticket. It may not exist or there was an error.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/customers/support" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Ticket List
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Ticket #{ticket.id}</p>
                </div>
                <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Conversation History */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {ticket.messages.map((message, index) => (
                <div key={index} className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xl p-4 rounded-lg ${message.sender === 'user' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    <p className="font-semibold">{message.sender === 'user' ? ticket.user.name : 'Support Agent'}</p>
                    <p className="text-gray-800">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-2 text-right">{formatDate(message.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle>Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows={5}
                disabled={replyMutation.isPending}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleReply} disabled={!replyMessage.trim() || replyMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Ticket Details Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">Status</h4>
                <Select 
                  value={ticket.status} 
                  onValueChange={(status) => updateStatusMutation.mutate(status)}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h4 className="font-semibold">Priority</h4>
                <Badge className={getStatusColor(ticket.priority, true)} variant="outline">
                  {ticket.priority}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold">Customer</h4>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{ticket.user.name}</span>
                </div>
                <p className="text-sm text-gray-500">{ticket.user.email}</p>
              </div>
              <div>
                <h4 className="font-semibold">Created</h4>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Last Updated</h4>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{formatDate(ticket.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
