'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/forms';
import { CardHeader, CardTitle } from '@/components/ui/layout';
import { List, PlusCircle } from 'lucide-react';

interface ExpenseCardHeaderProps {
  groupId?: string;
  showAddButton?: boolean;
  title?: string;
}

export function ExpenseCardHeader({
  groupId,
  showAddButton = true,
  title,
}: ExpenseCardHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-xl font-semibold flex items-center gap-2">
        <List className="h-5 w-5 text-primary" />
        {title || (groupId ? 'Group Expenses' : 'All Expenses')}
      </CardTitle>
      {showAddButton && (
        <Link href={groupId ? `/expenses/new?groupId=${groupId}` : '/expenses/new'}>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </Link>
      )}
    </CardHeader>
  );
}
