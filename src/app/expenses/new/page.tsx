'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';

function NewExpensePage() {
  const searchParams = useSearchParams();
  const preSelectedGroupId = searchParams.get('groupId');

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/expenses" className="hover:underline">
            Expenses
          </Link>
          <span>/</span>
          <span>New Expense</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">Add New Expense</h1>
        <p className="text-gray-500">Create a new expense to split with your group</p>
      </div>

      <ExpenseForm groupId={preSelectedGroupId || undefined} />
    </div>
  );
}

export default function NewExpensePageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewExpensePage />
    </Suspense>
  );
}
