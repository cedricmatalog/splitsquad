'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Expense } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { PlusCircle, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { useVirtualList } from '@/hooks/useVirtualList';
import React from 'react';

// Import sub-components
import { ExpenseFilters } from './ExpenseFilters';
import { ExpenseRow } from './ExpenseRow';
import { EmptyState } from './EmptyState';
import { ExpenseTableHeader } from './ExpenseTableHeader';
import { VirtualizedTable } from './VirtualizedTable';

interface ExpenseListProps {
  expenses: Expense[];
  groupId?: string;
  showGroupColumn?: boolean;
  limit?: number;
  pageSizeOptions?: number[];
}

export function ExpenseList({
  expenses,
  groupId,
  showGroupColumn = true,
  limit,
  pageSizeOptions = [5, 10, 25, 50, 100],
}: ExpenseListProps) {
  const { groups, users } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(pageSizeOptions[1]); // Default to the second option (10)
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, startDate, endDate]);

  // Filter expenses based on search term and date range
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    return expenses.filter(expense => {
      const matchesSearch =
        !searchTerm ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        users
          .find(user => user.id === expense.paidBy)
          ?.name.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const expenseDate = new Date(expense.date);
      const matchesStartDate =
        !startDate ||
        isAfter(expenseDate, startOfDay(startDate)) ||
        expense.date.includes(format(startDate, 'yyyy-MM-dd'));
      const matchesEndDate =
        !endDate ||
        isBefore(expenseDate, endOfDay(endDate)) ||
        expense.date.includes(format(endDate, 'yyyy-MM-dd'));

      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [expenses, searchTerm, startDate, endDate, users]);

  // Apply pagination
  const paginatedExpenses = useMemo(() => {
    if (limit) {
      return filteredExpenses.slice(0, limit);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredExpenses.slice(start, end);
  }, [filteredExpenses, page, pageSize, limit]);

  // Format date - memoized to avoid recreating on every render
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, []);

  // Format amount with currency symbol - memoized
  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Get user name by ID - memoized
  const getUserName = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user ? user.name : 'Unknown';
    },
    [users]
  );

  // Get user avatar by ID - memoized
  const getUserAvatar = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user?.avatar || '';
    },
    [users]
  );

  // Get group name by ID - memoized
  const getGroupName = useCallback(
    (groupId: string) => {
      const group = groups.find(group => group.id === groupId);
      return group ? group.name : 'Unknown Group';
    },
    [groups]
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  // Virtualization setup
  const rowHeight = 56; // Approximate height of a table row
  const { virtualItems, totalHeight } = useVirtualList({
    itemCount: paginatedExpenses.length,
    itemHeight: rowHeight,
    overscan: 5,
    containerRef: tableBodyRef,
  });

  // Handle scrolling
  const handleScroll = () => {
    if (!tableBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = tableBodyRef.current;

    // If we're close to the bottom and there's more data, pre-load next page
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      // Potentially load more data if using infinite scroll
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle previous page
  const handlePreviousPage = () => {
    if (page > 1) {
      handlePageChange(page - 1);
    }
  };

  // Handle next page
  const handleNextPage = () => {
    if (page < Math.ceil(filteredExpenses.length / pageSize)) {
      handlePageChange(page + 1);
    }
  };

  // Render table row
  const renderTableRow = useCallback(
    (expense: Expense, style?: React.CSSProperties) => (
      <ExpenseRow
        key={expense.id}
        expense={expense}
        formatAmount={formatAmount}
        formatDate={formatDate}
        getUserName={getUserName}
        getUserAvatar={getUserAvatar}
        getGroupName={getGroupName}
        showGroupColumn={showGroupColumn}
        style={style}
      />
    ),
    [showGroupColumn, formatAmount, formatDate, getUserName, getUserAvatar, getGroupName]
  );

  // Render empty state
  const emptyStateRow = useMemo(
    () => <EmptyState showGroupColumn={showGroupColumn} />,
    [showGroupColumn]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <List className="h-5 w-5 text-primary" />
          {groupId ? `Group Expenses` : 'All Expenses'}
        </CardTitle>
        {!limit && (
          <Button asChild size="sm">
            <Link href={groupId ? `/expenses/new?groupId=${groupId}` : '/expenses/new'}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Expense
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!limit && (
          <ExpenseFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            resetFilters={resetFilters}
          />
        )}

        <div className="mt-4 border rounded-md overflow-hidden">
          <div
            className="overflow-auto max-h-[500px]"
            onScroll={handleScroll}
            style={{ scrollbarWidth: 'thin' }}
          >
            <Table>
              <ExpenseTableHeader showGroupColumn={showGroupColumn} />
              <VirtualizedTable
                tableBodyRef={tableBodyRef}
                displayExpenses={paginatedExpenses}
                virtualItems={virtualItems}
                totalHeight={totalHeight}
                renderTableRow={renderTableRow}
                emptyStateRow={emptyStateRow}
              />
            </Table>
          </div>
        </div>

        {!limit && filteredExpenses.length > pageSize && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, filteredExpenses.length)} of {filteredExpenses.length}{' '}
              expenses
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {Math.ceil(filteredExpenses.length / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= Math.ceil(filteredExpenses.length / pageSize)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
