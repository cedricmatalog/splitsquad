'use client';

import { CardHeader, CardTitle, CardDescription } from '@/components/ui';

interface ExpenseFormHeaderProps {
  isEditing: boolean;
}

export function ExpenseFormHeader({ isEditing }: ExpenseFormHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className="text-xl font-semibold">
        {isEditing ? 'Edit Expense' : 'Add New Expense'}
      </CardTitle>
      <CardDescription>
        {isEditing
          ? 'Update this expense and recalculate balances.'
          : 'Record a new expense to split with your group.'}
      </CardDescription>
    </CardHeader>
  );
}
