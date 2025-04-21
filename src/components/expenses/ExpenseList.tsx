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
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

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
  
  // Filter expenses based on search term and date range
  const filteredExpenses = expenses.filter(expense => {
    // Filter by search term
    const searchMatches = 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(expense.paidBy).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (showGroupColumn && getGroupName(expense.groupId).toLowerCase().includes(searchTerm.toLowerCase()));
    
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
      currency: 'USD'
    }).format(amount);
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Expenses</span>
          {groupId && (
            <Button asChild>
              <Link href={`/expenses/new?groupId=${groupId}`}>
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
          )}
        </CardTitle>
        
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <Input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-64"
          />
          
          <div className="flex gap-2 items-center">
            <div className="w-40">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Start date"
              />
            </div>
            <span>to</span>
            <div className="w-40">
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="End date"
              />
            </div>
            
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid By</TableHead>
                {showGroupColumn && <TableHead>Group</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
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
                        <span>{getUserName(expense.paidBy)}</span>
                      </div>
                    </TableCell>
                    {showGroupColumn && (
                      <TableCell>
                        <Link 
                          href={`/groups/${expense.groupId}`} 
                          className="text-blue-600 hover:underline"
                        >
                          {getGroupName(expense.groupId)}
                        </Link>
                      </TableCell>
                    )}
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/expenses/${expense.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={showGroupColumn ? 6 : 5} className="text-center text-gray-500 h-24">
                    No expenses found.
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