'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Expense } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Search, Calendar, X, PlusCircle, Eye } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  groupId?: string;
  showGroupColumn?: boolean;
}

export function ExpenseList({ expenses, groupId, showGroupColumn = true }: ExpenseListProps) {
  const { users, groups } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Define helper functions before using them
  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Unknown';
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.avatar : '';
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(group => group.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter expenses based on search term and date range
  const filteredExpenses = expenses.filter(expense => {
    // Filter by search term
    const searchMatches =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(expense.paidBy).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (showGroupColumn &&
        getGroupName(expense.groupId).toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by date range
    let dateMatches = true;
    const expenseDate = new Date(expense.date);

    if (startDate) {
      dateMatches = dateMatches && isAfter(expenseDate, startOfDay(startDate));
    }

    if (endDate) {
      dateMatches = dateMatches && isBefore(expenseDate, endOfDay(endDate));
    }

    return searchMatches && dateMatches;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center text-xl">
          <span className="flex items-center gap-2">
            <PlusCircle size={18} className="text-primary" />
            Expenses
          </span>
          {groupId && (
            <Button asChild>
              <Link href={`/expenses/new?groupId=${groupId}`} className="flex items-center gap-2">
                <PlusCircle size={16} />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          )}
        </CardTitle>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <div className="w-full sm:w-36">
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
            </div>
            <span className="hidden sm:inline">to</span>
            <div className="w-full sm:w-36">
              <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
            </div>

            {(searchTerm || startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto sm:ml-0">
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
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
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium max-w-[120px] sm:max-w-none">
                      <div className="truncate">{expense.description}</div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {formatDate(expense.date)}
                      </div>
                    </TableCell>
                    <TableCell>{formatAmount(expense.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={getUserAvatar(expense.paidBy)}
                            alt={getUserName(expense.paidBy)}
                          />
                          <AvatarFallback>{getUserName(expense.paidBy).charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline">{getUserName(expense.paidBy)}</span>
                      </div>
                    </TableCell>
                    {showGroupColumn && (
                      <TableCell className="hidden md:table-cell">
                        <Link
                          href={`/groups/${expense.groupId}`}
                          className="text-primary hover:underline"
                        >
                          {getGroupName(expense.groupId)}
                        </Link>
                      </TableCell>
                    )}
                    <TableCell className="hidden sm:table-cell">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href={`/expenses/${expense.id}`} aria-label="View expense details">
                          <Eye size={16} />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={showGroupColumn ? 6 : 5}
                    className="text-center text-gray-500 h-24"
                  >
                    <div className="flex flex-col items-center py-4">
                      <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                      <p>No expenses found</p>
                      <p className="text-sm text-gray-400">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
