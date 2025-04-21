'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

export function UserBalanceCard() {
  const { calculateUserTotalBalance } = useExpenseCalculations();

  // Get user's total balance
  const userBalance = calculateUserTotalBalance();

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  // Determine status icon and color
  const getStatusInfo = () => {
    if (userBalance > 0) {
      return {
        icon: <ChevronUp className="h-5 w-5 text-green-600" />,
        color: 'text-green-600',
        text: 'You are owed',
      };
    } else if (userBalance < 0) {
      return {
        icon: <ChevronDown className="h-5 w-5 text-red-600" />,
        color: 'text-red-600',
        text: 'You owe',
      };
    } else {
      return {
        icon: <CheckCircle className="h-5 w-5 text-blue-600" />,
        color: 'text-blue-600',
        text: 'All settled up',
      };
    }
  };

  const { icon, color, text } = getStatusInfo();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Your Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-3xl font-bold ${color}`}>{formatAmount(userBalance)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{text}</p>
      </CardContent>
    </Card>
  );
}
