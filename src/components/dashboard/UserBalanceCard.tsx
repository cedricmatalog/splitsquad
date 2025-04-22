'use client';

import { useCallback, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import React from 'react';

/**
 * Displays a card showing the current user's net balance.
 *
 * Calculates the total amount owed to the user and the total amount the user owes
 * using the `useExpenseCalculations` hook and data from `AppContext`.
 * Shows the net balance with appropriate styling (green for positive, red for negative, blue for zero).
 * Provides a link to the payments page if the balance is non-zero.
 */
function UserBalanceCardComponent() {
  const { currentUser } = useAppContext();
  const { calculateUserTotalBalance } = useExpenseCalculations();

  // Memoized formatter to prevent rerenders
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  }, []);

  // Memoize the balance calculation to prevent unnecessary recalculations
  const balance = useMemo(
    () => (currentUser ? calculateUserTotalBalance() : 0),
    [currentUser, calculateUserTotalBalance]
  );

  // Memoize these derived values
  const balanceState = useMemo(() => {
    const isPositive = balance > 0;
    const isNegative = balance < 0;
    const isZero = balance === 0;
    return { isPositive, isNegative, isZero };
  }, [balance]);

  const { isPositive, isNegative, isZero } = balanceState;

  // Memoize the formatted balance
  const formattedBalance = useMemo(() => formatCurrency(balance), [formatCurrency, balance]);

  return (
    <Card
      className={`border shadow-sm card-hover-effect rounded-lg overflow-hidden animate-subtle-scale ${
        isPositive
          ? 'bg-gradient-to-br from-green-50 to-white border-green-100'
          : isNegative
            ? 'bg-gradient-to-br from-red-50 to-white border-red-100'
            : 'bg-gradient-to-br from-gray-50 to-white'
      }`}
    >
      <CardHeader className="pb-3 pt-3 bg-gradient-to-r from-white/50 to-transparent border-b">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <DollarSign
            size={16}
            className={`flex-shrink-0 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}
          />
          <span className="truncate">Your Balance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-3 relative flex flex-col items-center justify-center text-center h-[calc(100%-3rem)]">
        <div className="flex items-center gap-1.5 mt-2 mb-1">
          {isPositive ? (
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          ) : isNegative ? (
            <ArrowDownRight className="h-5 w-5 text-red-600" />
          ) : null}
          <div
            className={`text-2xl sm:text-3xl font-bold ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            {formattedBalance}
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-1">
          {isPositive ? "You're owed money" : isNegative ? 'You owe money' : 'All settled up!'}
        </p>

        {/* Visual indicator bar */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
          <div
            className={`h-full rounded-full ${
              isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-gray-300'
            }`}
            style={{
              width: isZero ? '50%' : `${Math.min((Math.abs(balance) / 10) * 100, 100)}%`,
              marginLeft: isZero ? '25%' : isNegative ? '0' : 'auto',
              marginRight: isPositive ? '0' : 'auto',
            }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const UserBalanceCard = React.memo(UserBalanceCardComponent);
