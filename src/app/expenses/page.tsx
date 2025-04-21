'use client';

import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { PageHeader } from '@/components/PageHeader';
import { PlusCircle } from 'lucide-react';

export default function Expenses() {
  const { expenses } = useAppContext();

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 max-w-6xl">
      <PageHeader
        title="Expenses"
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

      <ExpenseList expenses={expenses} showGroupColumn={true} />

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
