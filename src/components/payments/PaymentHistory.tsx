'use client';

import { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

interface PaymentHistoryProps {
  groupId?: string; // Optional to filter by group
  userId?: string;  // Optional to filter by user
  limit?: number;   // Optional to limit the number of payments shown
}

export function PaymentHistory({ groupId, userId, limit }: PaymentHistoryProps) {
  const { payments, users } = useAppContext();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let result = [...payments];
    
    // Apply filters
    if (groupId) {
      result = result.filter(payment => payment.groupId === groupId);
    }
    
    if (userId) {
      result = result.filter(payment => 
        payment.fromUser === userId || payment.toUser === userId
      );
    }
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    // Apply limit if specified
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }, [payments, groupId, userId, limit, sortDirection]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const toggleSort = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Record of all payments {groupId ? 'in this group' : ''}
            {userId ? ' involving this user' : ''}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSort}
        >
          Sort {sortDirection === 'asc' ? '↑' : '↓'}
        </Button>
      </CardHeader>
      <CardContent>
        {filteredPayments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No payments recorded yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.date)}</TableCell>
                  <TableCell className="font-medium">{getUserName(payment.fromUser)}</TableCell>
                  <TableCell>{getUserName(payment.toUser)}</TableCell>
                  <TableCell className="text-right">{formatAmount(payment.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 