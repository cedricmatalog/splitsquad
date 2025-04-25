'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Expense } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/layout';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import React from 'react';

// Import sub-components
import { ExpenseFilters } from './ExpenseFilters';
import { ExpenseRow } from './ExpenseRow';
import { ExpenseTableHeader } from './ExpenseTableHeader';
import { Pagination } from './Pagination';
import { TableContainer } from './TableContainer';
import { ExpenseCardHeader } from './ExpenseCardHeader';

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
  const pageSize = pageSizeOptions[1] || 10; // Default to the second option (10) or fallback to 10
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter expenses based on search term and date range using useMemo instead of useEffect
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return [];
    }

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

  // Calculate the current page expenses using useMemo instead of useEffect
  const currentPageExpenses = useMemo(() => {
    const effectivePageSize = limit || pageSize;
    const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / effectivePageSize));
    const safePage = Math.min(page, totalPages);

    if (filteredExpenses.length === 0) {
      return [];
    }

    // Calculate the correct start and end indices
    const start = (safePage - 1) * effectivePageSize;
    const end = Math.min(start + effectivePageSize, filteredExpenses.length);

    return filteredExpenses.slice(start, end);
  }, [filteredExpenses, page, pageSize, limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, startDate, endDate]);

  // Scroll to top when page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, []);

  // Format amount with currency symbol
  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Get user name by ID
  const getUserName = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user ? user.name : 'Unknown';
    },
    [users]
  );

  // Get user avatar by ID
  const getUserAvatar = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user?.avatar || '';
    },
    [users]
  );

  // Get group name by ID
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

  return (
    <Card>
      <ExpenseCardHeader groupId={groupId} showAddButton={!limit} />
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

        <TableContainer scrollContainerRef={scrollContainerRef} paginationKey={page}>
          <ExpenseTableHeader showGroupColumn={showGroupColumn} />

          {/* Simple non-virtualized table body */}
          <tbody className="[&_tr:last-child]:border-0">
            {currentPageExpenses.length === 0 ? (
              <tr>
                <td colSpan={showGroupColumn ? 6 : 5}>
                  <div className="p-4 text-center text-muted-foreground">
                    <span>No expenses found</span>
                    <div className="text-sm">Try adjusting your filters</div>
                  </div>
                </td>
              </tr>
            ) : (
              currentPageExpenses.map(expense => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  formatAmount={formatAmount}
                  formatDate={formatDate}
                  getUserName={getUserName}
                  getUserAvatar={getUserAvatar}
                  getGroupName={getGroupName}
                  showGroupColumn={showGroupColumn}
                />
              ))
            )}
          </tbody>
        </TableContainer>

        {/* Show pagination only when there are enough expenses */}
        {filteredExpenses.length > 0 && (
          <Pagination
            page={page}
            pageSize={limit || pageSize}
            totalItems={filteredExpenses.length}
            onPageChange={handlePageChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
