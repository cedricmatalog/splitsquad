'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/forms';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/display';
import { Eye, Edit, Trash2 } from 'lucide-react';
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
  // Define column widths that match the headers
  const colWidths = {
    desc: '30%',
    amount: '15%',
    paidBy: '20%',
    group: '15%',
    date: '15%',
    actions: '120px',
  };

  return (
    <tr
      key={expense.id}
      className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors table w-full table-fixed"
      style={style}
    >
      <td className="p-2 align-middle font-medium" style={{ width: colWidths.desc }}>
        <div className="truncate">{expense.description}</div>
        <div className="text-xs text-gray-500 sm:hidden">{formatDate(expense.date)}</div>
      </td>
      <td className="p-2 align-middle" style={{ width: colWidths.amount }}>
        {formatAmount(expense.amount)}
      </td>
      <td className="p-2 align-middle" style={{ width: colWidths.paidBy }}>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={getUserAvatar(expense.paidBy)} alt={getUserName(expense.paidBy)} />
            <AvatarFallback>{getUserName(expense.paidBy).charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline truncate">{getUserName(expense.paidBy)}</span>
        </div>
      </td>
      {showGroupColumn && (
        <td className="p-2 align-middle hidden md:table-cell" style={{ width: colWidths.group }}>
          <Link
            href={`/groups/${expense.groupId}`}
            className="text-primary hover:underline truncate"
          >
            {getGroupName(expense.groupId)}
          </Link>
        </td>
      )}
      <td
        className="p-2 align-middle text-right hidden sm:table-cell"
        style={{ width: colWidths.date }}
      >
        {formatDate(expense.date)}
      </td>
      <td className="p-2 align-middle text-center" style={{ width: colWidths.actions }}>
        <div className="flex items-center justify-center gap-1">
          <Link href={`/expenses/${expense.id}`} aria-label="View expense details">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Eye size={16} />
            </Button>
          </Link>

          <Link href={`/expenses/${expense.id}/edit`} aria-label="Edit expense">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Edit size={16} />
            </Button>
          </Link>

          <Link href={`/expenses/${expense.id}/delete`} aria-label="Delete expense">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  );
}
