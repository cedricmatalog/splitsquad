'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { ArrowUpDown } from 'lucide-react';
import { deletePayment } from '@/services/payments';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

// Import modular components
import { PaymentTable, MobilePaymentList, EmptyPaymentState, DeletePaymentDialog } from './';

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
            <EmptyPaymentState groupId={groupId} />
          ) : (
            <>
              {/* Desktop view */}
              <PaymentTable
                payments={filteredPayments}
                formatDate={formatDate}
                formatAmount={formatAmount}
                getUserName={getUserName}
                canDeletePayment={canDeletePayment}
                onDeleteClick={handleDeleteClick}
              />

              {/* Mobile view */}
              <MobilePaymentList
                payments={filteredPayments}
                formatDate={formatDate}
                formatAmount={formatAmount}
                getUserName={getUserName}
                canDeletePayment={canDeletePayment}
                onDeleteClick={handleDeleteClick}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeletePaymentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeletePayment}
        isDeleting={isDeleting}
        Spinner={Spinner}
      />
    </>
  );
}
