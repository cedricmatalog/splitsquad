'use client';

import { Suspense, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';

function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: expenseId } = use(params);
  const { expenses } = useAppContext();
  const { getExpenseParticipants } = useExpenseCalculations();

  const expense = expenses.find(e => e.id === expenseId);

  if (!expense) {
    notFound();
  }

  const expenseParticipants = getExpenseParticipants(expenseId);

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/expenses" className="hover:underline">
            Expenses
          </Link>
          <span>/</span>
          <Link href={`/expenses/${expenseId}`} className="hover:underline">
            {expense.description}
          </Link>
          <span>/</span>
          <span>Edit</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">Edit Expense</h1>
        <p className="text-gray-500">Update the details of this expense</p>
      </div>

      <ExpenseForm expense={expense} expenseParticipants={expenseParticipants} isEditing={true} />
    </div>
  );
}

export default function EditExpensePageWithSuspense({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditExpensePage params={Promise.resolve(params)} />
    </Suspense>
  );
}
