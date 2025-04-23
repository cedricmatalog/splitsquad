'use client';

import { useAppContext } from '@/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { PageHeader } from '@/components/PageHeader';
import { AuthCheck } from '@/components/AuthCheck';
import { Suspense } from 'react';

// Create a component that uses useSearchParams
function ExpenseFormWithGroup() {
  const { groups } = useAppContext();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');

  // Find the group if a groupId was provided
  const group = groupId ? groups.find(g => g.id === groupId) : undefined;

  return (
    <>
      <PageHeader
        title="Add New Expense"
        description={group ? `Adding to ${group.name}` : 'Record a new expense'}
      />

      <div className="mt-8">
        <ExpenseForm groupId={groupId || undefined} />
      </div>
    </>
  );
}

// Main component using Suspense
export default function NewExpensePage() {
  return (
    <AuthCheck>
      <div className="container mx-auto py-8 max-w-5xl px-4 sm:px-6">
        <Suspense
          fallback={
            <div>
              <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-md mb-4"></div>
              <div className="h-6 w-64 bg-gray-200 animate-pulse rounded-md"></div>
              <div className="mt-8 h-96 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
          }
        >
          <ExpenseFormWithGroup />
        </Suspense>
      </div>
    </AuthCheck>
  );
}
