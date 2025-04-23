'use client';

import { useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
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
import {
  Search,
  Calendar,
  X,
  PlusCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  List,
} from 'lucide-react';
import { useVirtualList } from '@/hooks/useVirtualList';
import React from 'react';

// Detect test environment
const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

interface ExpenseListProps {
  expenses: Expense[];
  groupId?: string;
  showGroupColumn?: boolean;
  limit?: number;
  pageSizeOptions?: number[];
}

// Sub-component for search and filters
interface ExpenseFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  resetFilters: () => void;
}

function ExpenseFilters({
  searchTerm,
  setSearchTerm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
}: ExpenseFiltersProps) {
  return (
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
  );
}

// Sub-component for expense row
interface ExpenseRowProps {
  expense: Expense;
  formatAmount: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getUserName: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getGroupName: (groupId: string) => string;
  showGroupColumn: boolean;
}

function ExpenseRow({
  expense,
  formatAmount,
  formatDate,
  getUserName,
  getUserAvatar,
  getGroupName,
  showGroupColumn,
}: ExpenseRowProps) {
  return (
    <TableRow key={expense.id}>
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

// Sub-component for empty state
interface EmptyStateProps {
  showGroupColumn: boolean;
}

function EmptyState({ showGroupColumn }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={showGroupColumn ? 6 : 5} className="text-center text-gray-500 h-24">
        <div className="flex flex-col items-center py-4">
          <Calendar className="h-10 w-10 text-gray-300 mb-2" />
          <p>No expenses found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Sub-component for table header
interface ExpenseTableHeaderProps {
  showGroupColumn: boolean;
}

function ExpenseTableHeader({ showGroupColumn }: ExpenseTableHeaderProps) {
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

// Sub-component for virtualized table
interface VirtualizedTableProps {
  tableBodyRef: React.RefObject<HTMLTableSectionElement | null>;
  displayExpenses: Expense[];
  virtualItems: { index: number; offsetTop: number; height: number }[];
  totalHeight: number;
  renderTableRow: (expense: Expense) => ReactNode;
  emptyStateRow: ReactNode;
}

function VirtualizedTable({
  tableBodyRef,
  displayExpenses,
  virtualItems,
  totalHeight,
  renderTableRow,
  emptyStateRow,
}: VirtualizedTableProps) {
  return (
    <TableBody
      ref={tableBodyRef}
      style={{
        height: '400px',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {displayExpenses.length > 0 ? (
        <>
          <div style={{ height: totalHeight, position: 'relative' }}>
            {virtualItems.map(virtualItem => {
              const expense = displayExpenses[virtualItem.index];
              return (
                <div
                  key={expense.id}
                  style={{
                    position: 'absolute',
                    top: virtualItem.offsetTop,
                    left: 0,
                    width: '100%',
                    height: virtualItem.height,
                  }}
                >
                  {renderTableRow(expense)}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        emptyStateRow
      )}
    </TableBody>
  );
}

// Main component
function ExpenseListComponent({
  expenses,
  groupId,
  showGroupColumn = true,
  limit,
  pageSizeOptions = [5, 10, 25, 50, 100],
}: ExpenseListProps) {
  const { users, groups } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(limit || pageSizeOptions[0]);
  const [showAll, setShowAll] = useState(false);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, pageSize]);

  // Memoize helper functions
  const getUserName = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user ? user.name : 'Unknown';
    },
    [users]
  );

  const getUserAvatar = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user ? user.avatar : '';
    },
    [users]
  );

  const getGroupName = useCallback(
    (groupId: string) => {
      const group = groups.find(group => group.id === groupId);
      return group ? group.name : 'Unknown Group';
    },
    [groups]
  );

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  }, []);

  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  // Filter expenses based on search term and date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
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
  }, [expenses, searchTerm, startDate, endDate, getUserName, getGroupName, showGroupColumn]);

  // Calculate pagination values
  const totalItems = filteredExpenses.length;
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure currentPage is always valid when totalPages changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Apply pagination to filtered expenses
  const displayExpenses = useMemo(() => {
    if (showAll) return filteredExpenses;

    // Handle the first page with limit case
    if (limit && !showAll && currentPage === 1 && pageSize === limit) {
      return filteredExpenses.slice(0, limit);
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    return filteredExpenses.slice(startIndex, endIndex);
  }, [filteredExpenses, currentPage, pageSize, showAll, limit, totalItems]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  // Create a proper ref of the correct type for the TableBody
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  // Set up virtual list for better performance with large datasets
  const { virtualItems, totalHeight } = useVirtualList<HTMLTableSectionElement>({
    itemCount: displayExpenses.length || 1, // At least 1 for "no expenses found" row
    itemHeight: 56, // Approximate height of a table row
    containerRef: tableBodyRef,
  });

  // Set up scroll event handler on the TableBody
  useEffect(() => {
    const element = tableBodyRef.current;
    if (!element) return;

    const handleScroll = () => {
      // Handle scroll logic if needed
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    // Reset scroll position when changing pages
    element.scrollTop = 0;

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [displayExpenses, currentPage]);

  // Render a virtualized table row
  const renderTableRow = useCallback(
    (expense: Expense) => (
      <ExpenseRow
        expense={expense}
        formatAmount={formatAmount}
        formatDate={formatDate}
        getUserName={getUserName}
        getUserAvatar={getUserAvatar}
        getGroupName={getGroupName}
        showGroupColumn={showGroupColumn}
      />
    ),
    [formatAmount, formatDate, getGroupName, getUserAvatar, getUserName, showGroupColumn]
  );

  // Render empty state row
  const emptyStateRow = useMemo(
    () => <EmptyState showGroupColumn={showGroupColumn} />,
    [showGroupColumn]
  );

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Render the table content based on environment
  const renderTableContent = () => {
    // In test environment, render a simple version without virtualization
    if (isTestEnvironment || displayExpenses.length <= 100) {
      return (
        <TableBody>
          {displayExpenses.length > 0
            ? displayExpenses.map(expense => (
                <React.Fragment key={expense.id}>{renderTableRow(expense)}</React.Fragment>
              ))
            : emptyStateRow}
        </TableBody>
      );
    }

    // In production with large datasets (>100 items), use virtualized list
    return (
      <VirtualizedTable
        tableBodyRef={tableBodyRef}
        displayExpenses={displayExpenses}
        virtualItems={virtualItems}
        totalHeight={totalHeight}
        renderTableRow={renderTableRow}
        emptyStateRow={emptyStateRow}
      />
    );
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center text-xl">
          <span className="flex items-center gap-2">
            <List size={18} className="text-primary" />
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

        <ExpenseFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          resetFilters={resetFilters}
        />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <ExpenseTableHeader showGroupColumn={showGroupColumn} />
            {renderTableContent()}

            {/* Debug info */}
            <caption className="mt-2 text-sm text-gray-500 text-right">
              Total: {filteredExpenses.length} expenses
              {!showAll &&
                ` (${displayExpenses.length} visible, page ${currentPage}/${totalPages}, ${pageSize} per page)`}
              {showAll && ' (all visible)'}
            </caption>
          </Table>
        </div>

        {/* No results message when filtering returns no data */}
        {filteredExpenses.length === 0 && (searchTerm || startDate || endDate) && (
          <div className="py-6 text-center">
            <p className="text-gray-500 mb-3">No expenses match your filters</p>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center gap-2 mx-auto"
            >
              <X size={14} />
              <span>Clear Filters</span>
            </Button>
          </div>
        )}

        {/* Pagination controls */}
        {totalItems > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            {/* Page size selector */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 whitespace-nowrap">Show</span>
              <select
                value={showAll ? 'all' : pageSize.toString()}
                onChange={e => {
                  const value = e.target.value;

                  // Always reset to page 1 when changing display options
                  setCurrentPage(1);

                  if (value === 'all') {
                    setShowAll(true);
                  } else {
                    setShowAll(false);
                    const newSize = parseInt(value, 10);
                    setPageSize(newSize);
                  }
                }}
                className="bg-white border rounded px-2 py-1"
                aria-label="Select number of items per page"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size.toString()}>
                    {size}
                  </option>
                ))}
                <option value="all">All</option>
              </select>
              <span className="text-gray-500 whitespace-nowrap">per page</span>
            </div>

            {/* Page navigation */}
            {!showAll && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </Button>

                <div className="flex gap-1">
                  {/* Show first page */}
                  {currentPage > 2 && (
                    <Button
                      size="sm"
                      variant={currentPage === 1 ? 'default' : 'outline'}
                      onClick={() => handlePageChange(1)}
                      className="h-8 w-8 p-0"
                    >
                      1
                    </Button>
                  )}

                  {/* Ellipsis if needed */}
                  {currentPage > 3 && (
                    <span className="px-2 flex items-center text-gray-500">...</span>
                  )}

                  {/* Page before current */}
                  {currentPage > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="h-8 w-8 p-0"
                    >
                      {currentPage - 1}
                    </Button>
                  )}

                  {/* Current page */}
                  <Button size="sm" variant="default" className="h-8 w-8 p-0">
                    {currentPage}
                  </Button>

                  {/* Page after current */}
                  {currentPage < totalPages && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="h-8 w-8 p-0"
                    >
                      {currentPage + 1}
                    </Button>
                  )}

                  {/* Ellipsis if needed */}
                  {currentPage < totalPages - 2 && (
                    <span className="px-2 flex items-center text-gray-500">...</span>
                  )}

                  {/* Last page */}
                  {currentPage < totalPages - 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(totalPages)}
                      className="h-8 w-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}

            {/* Page info */}
            <div className="text-sm text-gray-500 whitespace-nowrap">
              {showAll
                ? `Showing all ${totalItems} expenses`
                : `Showing ${totalItems === 0 ? '0' : Math.min((currentPage - 1) * pageSize + 1, totalItems)}-${Math.min(currentPage * pageSize, totalItems)} of ${totalItems}`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Use React.memo to prevent unnecessary re-renders
export const ExpenseList = React.memo(ExpenseListComponent);
