'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronUp, ChevronDown, CheckCircle, ArrowRight } from 'lucide-react';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

export function UserBalanceCard() {
  const { calculateTotalOwedToUser, calculateTotalUserOwes } = useExpenseCalculations();
  const { currentUser } = useAppContext();

  if (!currentUser) return null;

  // Get user's total balances
  const totalOwed = calculateTotalOwedToUser(currentUser.id);
  const totalOwe = calculateTotalUserOwes(currentUser.id);
  const netBalance = totalOwed - totalOwe;

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  // Determine status icon and color
  const getStatusInfo = () => {
    if (netBalance > 0) {
      return {
        icon: <ChevronUp className="h-5 w-5 text-green-600" />,
        color: 'text-green-600',
        text: 'You are owed',
      };
    } else if (netBalance < 0) {
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
        {netBalance !== 0 && (
          <CardDescription className="text-xs">
            {totalOwed > 0 && `You are owed ${formatAmount(totalOwed)}. `}
            {totalOwe > 0 && `You owe ${formatAmount(totalOwe)}.`}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-3xl font-bold ${color}`}>{formatAmount(netBalance)}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 mt-1">{text}</p>
          
          {netBalance !== 0 && (
            <Button variant="ghost" size="sm" className="text-xs mt-1" asChild>
              <Link href="/payments" className="flex items-center gap-1">
                View Payments
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
