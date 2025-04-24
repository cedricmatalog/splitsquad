'use client';

import { TableHeader, TableRow, TableHead } from '@/components/ui';

// Sub-component for table header
interface ExpenseTableHeaderProps {
  showGroupColumn: boolean;
}

export function ExpenseTableHeader({ showGroupColumn }: ExpenseTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="font-medium">Description</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Paid By</TableHead>
        {showGroupColumn && <TableHead className="hidden md:table-cell">Group</TableHead>}
        <TableHead className="hidden sm:table-cell">Date</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
