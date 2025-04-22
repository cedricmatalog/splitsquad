'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { PageHeader } from '@/components/PageHeader';
import { PlusCircle } from 'lucide-react';

export default function Expenses() {
  const { expenses, currentUser, groupMembers } = useAppContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!currentUser) {
      // Save current URL for redirection after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [currentUser, router]);

  // Filter expenses to only show those from groups the user is a member of
  const userExpenses = currentUser
    ? expenses.filter(expense => {
        // Check if the user is a member of the expense's group or created the group
        return groupMembers.some(
          member => member.userId === currentUser.id && member.groupId === expense.groupId
        );
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 max-w-6xl">
      <PageHeader
        title="My Expenses"
        description="Manage all your expenses"
        action={
          <Button asChild className="whitespace-nowrap">
            <Link href="/expenses/new" className="flex items-center gap-2">
              <PlusCircle size={16} />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        }
      />

      <ExpenseList expenses={userExpenses} showGroupColumn={true} />

      {/* Mobile floating action button for quick expense creation */}
      <div className="fixed right-4 bottom-20 md:hidden">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg" asChild>
          <Link href="/expenses/new" aria-label="Add new expense">
            <PlusCircle size={24} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
