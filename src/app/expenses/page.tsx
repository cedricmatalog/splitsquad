'use client';

import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/expenses/ExpenseList';

export default function Expenses() {
  const { expenses } = useAppContext();

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Expenses</h1>
          <p className="text-gray-500">Manage all your expenses</p>
        </div>

        <Button asChild>
          <Link href="/expenses/new">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Add Expense
          </Link>
        </Button>
      </div>

      <ExpenseList expenses={expenses} showGroupColumn={true} />
    </div>
  );
}
