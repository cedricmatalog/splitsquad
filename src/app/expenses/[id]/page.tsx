'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { format } from 'date-fns';
import { deleteExpense } from '@/services/expenses';
import { deleteExpenseParticipantsByExpenseId } from '@/services/expense_participants';

export default function ExpenseDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: expenseId } = use(params);
  const router = useRouter();
  const {
    expenses,
    users,
    groups,
    setExpenses,
    setExpenseParticipants,
    currentUser,
    groupMembers,
    refreshData,
  } = useAppContext();
  const { getExpenseParticipants } = useExpenseCalculations();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const expense = expenses.find(e => e.id === expenseId);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!currentUser) {
      // Save current URL for redirection after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      router.push('/login');
      return;
    }

    // If expense exists, check if user is a member of the group
    if (expense) {
      const isUserMember = groupMembers.some(
        member => member.userId === currentUser.id && member.groupId === expense.groupId
      );

      if (!isUserMember) {
        // User is not a member of this expense's group, redirect to expenses page
        router.push('/expenses');
        return;
      }
    }

    setIsLoading(false);
  }, [currentUser, router, expense, groupMembers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="container mx-auto py-8 max-w-6xl text-center">
        <h1 className="text-3xl font-bold mb-4">Expense Not Found</h1>
        <p className="mb-6 text-gray-500">
          The expense you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/expenses">Back to Expenses</Link>
        </Button>
      </div>
    );
  }

  const participants = getExpenseParticipants(expenseId);

  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Unknown';
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.avatar : '';
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(group => group.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // First delete all expense participants
      const participantsDeleted = await deleteExpenseParticipantsByExpenseId(expenseId);
      if (!participantsDeleted) {
        console.warn('Failed to delete expense participants, but will attempt to delete expense');
      }

      // Then delete the expense itself
      const expenseDeleted = await deleteExpense(expenseId);
      if (!expenseDeleted) {
        throw new Error('Failed to delete expense from database');
      }

      // Store group ID for navigation since we're about to close the dialog
      const groupId = expense.groupId;

      // Close the dialog immediately before any state updates
      setIsDeleteDialogOpen(false);

      // Navigate immediately to prevent UI flicker
      router.push(`/groups/${groupId}`);

      // Update local state after navigation has been initiated
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      setExpenseParticipants(prev => prev.filter(p => p.expenseId !== expenseId));

      // Refresh data in the background after navigation
      setTimeout(() => {
        refreshData().catch(error => {
          console.warn('Failed to refresh data after deleting expense:', error);
        });
      }, 100);
    } catch (error) {
      console.error('Error deleting expense:', error);
      // Show error message to user
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      alert('Failed to delete expense. Please try again.');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/expenses" className="hover:underline">
            Expenses
          </Link>
          <span>/</span>
          <Link href={`/groups/${expense.groupId}`} className="hover:underline">
            {getGroupName(expense.groupId)}
          </Link>
          <span>/</span>
          <span>{expense.description}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{expense.description}</h1>
            <p className="text-gray-500">Added on {formatDate(expense.date)}</p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/expenses/${expenseId}/edit`}>Edit</Link>
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-xl font-bold">{formatAmount(expense.amount)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Paid By</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={getUserAvatar(expense.paidBy)}
                    alt={getUserName(expense.paidBy)}
                  />
                  <AvatarFallback>{getUserName(expense.paidBy).charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{getUserName(expense.paidBy)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Group</p>
              <Link href={`/groups/${expense.groupId}`} className="text-blue-600 hover:underline">
                {getGroupName(expense.groupId)}
              </Link>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p>{formatDate(expense.date)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Split Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participants.map(participant => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={getUserAvatar(participant.userId)}
                        alt={getUserName(participant.userId)}
                      />
                      <AvatarFallback>{getUserName(participant.userId).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{getUserName(participant.userId)}</span>
                  </div>
                  <div className="font-medium">{formatAmount(participant.share)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={`/groups/${expense.groupId}`}>Back to Group</Link>
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
