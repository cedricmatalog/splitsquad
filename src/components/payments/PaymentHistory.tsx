'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { DollarSign, ArrowUpDown, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { deletePayment } from '@/services/payments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

// Spinner component
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin h-4 w-4', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

interface PaymentHistoryProps {
  groupId?: string; // Optional to filter by group
  userId?: string; // Optional to filter by user
  limit?: number; // Optional to limit the number of payments shown
}

export function PaymentHistory({ groupId, userId, limit }: PaymentHistoryProps) {
  const { payments, users, groupMembers, currentUser, refreshData, setPayments } = useAppContext();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isSorting, setIsSorting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let result = [...payments];

    // Apply filters
    if (groupId) {
      result = result.filter(payment => payment.groupId === groupId);
    }

    if (userId) {
      result = result.filter(payment => payment.fromUser === userId || payment.toUser === userId);
    }

    // Filter payments to only include those from groups the current user is a member of
    if (currentUser) {
      // Get all groups the current user is a member of
      const userGroupIds = groupMembers
        .filter(member => member.userId === currentUser.id)
        .map(member => member.groupId);

      // Only include payments from groups the user is a member of
      result = result.filter(payment => userGroupIds.includes(payment.groupId));
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Apply limit if specified
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [payments, groupId, userId, limit, sortDirection, groupMembers, currentUser]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const toggleSort = async () => {
    setIsSorting(true);
    // Simulate a short delay to show the spinner
    await new Promise(resolve => setTimeout(resolve, 300));
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    setIsSorting(false);
  };

  // Check if the current user can delete a payment (if they're involved or an admin)
  const canDeletePayment = (paymentId: string) => {
    if (!currentUser) return false;

    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return false;

    // Users can delete payments if they are either the sender or receiver
    return payment.fromUser === currentUser.id || payment.toUser === currentUser.id;
  };

  // Handle delete payment confirmation dialog
  const handleDeleteClick = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setShowDeleteDialog(true);
  };

  // Handle actual payment deletion
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      setIsDeleting(true);
      const success = await deletePayment(paymentToDelete);

      if (success) {
        // Update local state to remove the deleted payment
        setPayments(currentPayments =>
          currentPayments.filter(payment => payment.id !== paymentToDelete)
        );

        toast({
          title: 'Payment deleted',
          description: 'The payment has been successfully deleted.',
        });

        // Refresh data to ensure everything is in sync
        refreshData();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete the payment. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setPaymentToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Record of all payments {groupId ? 'in this group' : ''}
              {userId ? ' involving this user' : ''}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSort}
            disabled={isSorting}
            className="gap-1"
          >
            {isSorting ? (
              <>
                <Spinner /> Sorting...
              </>
            ) : (
              <>
                <ArrowUpDown className="h-4 w-4" />
                {sortDirection === 'asc' ? 'Oldest first' : 'Newest first'}
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                <DollarSign className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No payments recorded yet</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                When group members record payments to each other, they will appear here.
              </p>
              {groupId && (
                <Button asChild>
                  <Link href={`/groups/${groupId}/payments/new`}>Record a Payment</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop view */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="font-medium">
                          {getUserName(payment.fromUser)}
                        </TableCell>
                        <TableCell>{getUserName(payment.toUser)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {payment.paymentMethod ? (
                            <span className="capitalize">
                              {payment.paymentMethod.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.notes ? (
                            <span className="text-sm truncate max-w-[200px] block">
                              {payment.notes}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {canDeletePayment(payment.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(payment.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete payment</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {filteredPayments.map(payment => (
                  <div key={payment.id} className="border rounded-md p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">{formatDate(payment.date)}</div>
                      <div className="font-medium text-right">{formatAmount(payment.amount)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div className="text-gray-500">From:</div>
                      <div className="font-medium">{getUserName(payment.fromUser)}</div>

                      <div className="text-gray-500">To:</div>
                      <div>{getUserName(payment.toUser)}</div>

                      {payment.paymentMethod && (
                        <>
                          <div className="text-gray-500">Method:</div>
                          <div className="capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </div>
                        </>
                      )}
                    </div>

                    {payment.notes && (
                      <div className="pt-1 border-t mt-2">
                        <div className="text-xs text-gray-500 mb-1">Notes:</div>
                        <div className="text-sm">{payment.notes}</div>
                      </div>
                    )}

                    {canDeletePayment(payment.id) && (
                      <div className="pt-2 mt-2 border-t flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(payment.id)}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirm Delete Payment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePayment} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Spinner className="mr-2" /> Deleting...
                </>
              ) : (
                'Delete Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
