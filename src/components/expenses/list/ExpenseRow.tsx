'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TableRow, TableCell } from '@/components/ui/table';
import { Eye } from 'lucide-react';
import { Expense } from '@/types';

// Sub-component for expense row
interface ExpenseRowProps {
  expense: Expense;
  formatAmount: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getUserName: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getGroupName: (groupId: string) => string;
  showGroupColumn: boolean;
  style?: React.CSSProperties;
}

export function ExpenseRow({
  expense,
  formatAmount,
  formatDate,
  getUserName,
  getUserAvatar,
  getGroupName,
  showGroupColumn,
  style,
}: ExpenseRowProps) {
  return (
    <TableRow key={expense.id} style={style}>
      <TableCell className="font-medium max-w-[120px] sm:max-w-none">
        <div className="truncate">{expense.description}</div>
        <div className="text-xs text-gray-500 sm:hidden">{formatDate(expense.date)}</div>
      </TableCell>
      <TableCell>{formatAmount(expense.amount)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={getUserAvatar(expense.paidBy)} alt={getUserName(expense.paidBy)} />
            <AvatarFallback>{getUserName(expense.paidBy).charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{getUserName(expense.paidBy)}</span>
        </div>
      </TableCell>
      {showGroupColumn && (
        <TableCell className="hidden md:table-cell">
          <Link href={`/groups/${expense.groupId}`} className="text-primary hover:underline">
            {getGroupName(expense.groupId)}
          </Link>
        </TableCell>
      )}
      <TableCell className="hidden sm:table-cell">{formatDate(expense.date)}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
          <Link href={`/expenses/${expense.id}`} aria-label="View expense details">
            <Eye size={16} />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
