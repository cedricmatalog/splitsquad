'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/expenses/list';
import { PageHeader } from '@/components/PageHeader';
import { PlusCircle } from 'lucide-react';
import { Expense } from '@/types';

export default function Expenses() {
  const {
    expenses,
    currentUser,
    groupMembers,
    groups,
    isLoading: contextLoading,
  } = useAppContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if user is not authenticated, but only after the authentication state is loaded
  useEffect(() => {
    if (!contextLoading) {
      if (!currentUser) {
        // Save current URL for redirection after login
        if (typeof window !== 'undefined') {
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [currentUser, router, contextLoading]);

  // Debug logging
  useEffect(() => {
    if (currentUser) {
      console.log('Expenses Page Debug info:');
      console.log('Total expenses:', expenses.length);
      console.log('Current user ID:', currentUser.id);
      console.log('Total group members:', groupMembers.length);
      console.log(
        'Group members for current user:',
        groupMembers.filter(member => member.userId === currentUser.id)
      );
      console.log('All groups:', groups);

      // Log expenses by group to help diagnose issues
      const expensesByGroup: Record<string, Expense[]> = {};
      expenses.forEach(expense => {
        if (!expensesByGroup[expense.groupId]) {
          expensesByGroup[expense.groupId] = [];
        }
        expensesByGroup[expense.groupId].push(expense);
      });
      console.log('Expenses by group:', expensesByGroup);

      // Check which groups the user is a member of
      const userGroupIds = groupMembers
        .filter(member => member.userId === currentUser.id)
        .map(member => member.groupId);
      console.log('User is a member of these groups:', userGroupIds);

      // Check which groups the user created
      const userCreatedGroupIds = groups
        .filter(group => group.createdBy === currentUser.id)
        .map(group => group.id);
      console.log('User created these groups:', userCreatedGroupIds);
    }
  }, [expenses, currentUser, groupMembers, groups]);

  // Filter expenses to only show those from groups the user is a member of or created
  const userExpenses = useMemo(() => {
    if (!currentUser) return [];

    return expenses.filter(expense => {
      // Get the group for this expense
      const group = groups.find(g => g.id === expense.groupId);

      // Check if the user is a member of the expense's group
      const isMember = groupMembers.some(
        member => member.userId === currentUser.id && member.groupId === expense.groupId
      );

      // Check if the user created the group
      const isCreator = group && group.createdBy === currentUser.id;

      // Check if the user is the one who paid for the expense
      const isPayer = expense.paidBy === currentUser.id;

      // Allow the expense if the user is a member, creator, or payer
      return isMember || isCreator || isPayer;
    });
  }, [currentUser, expenses, groups, groupMembers]);

  // Debug log the filtered expenses
  useEffect(() => {
    if (currentUser) {
      console.log('Filtered user expenses count:', userExpenses.length);
      if (userExpenses.length === 0 && expenses.length > 0) {
        console.warn('No expenses passed the filter despite having expenses in the system');
      }
    }
  }, [userExpenses, currentUser, expenses]);

  // Show loading state while context is loading or component is loading
  if (contextLoading || isLoading) {
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

      {userExpenses.length === 0 && (
        <div className="my-8 text-center p-8 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-2">No expenses found</h3>
          <p className="text-gray-500 mb-4">
            You don&apos;t have any expenses yet. Add one to get started!
          </p>
          <Button asChild>
            <Link href="/expenses/new">Add First Expense</Link>
          </Button>
        </div>
      )}

      {userExpenses.length > 0 && <ExpenseList expenses={userExpenses} showGroupColumn={true} />}

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
