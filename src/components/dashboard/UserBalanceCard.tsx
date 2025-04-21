'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronUp, ChevronDown, CheckCircle, ArrowRight, DollarSign } from 'lucide-react';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

/**
 * Displays a card showing the current user's net balance.
 *
 * Calculates the total amount owed to the user and the total amount the user owes
 * using the `useExpenseCalculations` hook and data from `AppContext`.
 * Shows the net balance with appropriate styling (green for positive, red for negative, blue for zero).
 * Provides a link to the payments page if the balance is non-zero.
 */
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
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  // Determine status icon and color
  const getStatusInfo = () => {
    if (netBalance > 0) {
      return {
        icon: <ChevronUp className="h-5 w-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        border: 'border-green-100',
        text: 'You are owed',
      };
    } else if (netBalance < 0) {
      return {
        icon: <ChevronDown className="h-5 w-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        border: 'border-red-100',
        text: 'You owe',
      };
    } else {
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        border: 'border-blue-100',
        text: 'All settled up',
      };
    }
  };

  const { icon, color, bgColor, text } = getStatusInfo();

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1 flex flex-col rounded-lg overflow-hidden">
      <CardHeader className="pb-3 pt-3 ">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2 truncate">
            <DollarSign size={16} className="text-blue-600 flex-shrink-0" />
            <span className="truncate">Your Balance</span>
          </CardTitle>
          {netBalance !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 -mr-2 flex-shrink-0 text-blue-600 hover:text-blue-700"
              asChild
            >
              <Link href="/payments" className="flex items-center gap-1 font-medium">
                View Details
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
        {netBalance !== 0 && (
          <CardDescription className="text-xs mt-1 overflow-hidden">
            <div className="space-y-1 sm:space-y-0">
              {totalOwed > 0 && (
                <span className="block sm:inline truncate">
                  You are owed {formatAmount(totalOwed)}.{' '}
                </span>
              )}
              {totalOwe > 0 && (
                <span className="block sm:inline truncate">You owe {formatAmount(totalOwe)}.</span>
              )}
            </div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6 pb-6 flex-grow flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${bgColor} ${color} flex-shrink-0`}>{icon}</div>
          <span className={`text-2xl sm:text-3xl font-bold ${color} truncate`}>
            {formatAmount(netBalance)}
          </span>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600 font-medium truncate">{text}</p>
        </div>
      </CardContent>
    </Card>
  );
}
