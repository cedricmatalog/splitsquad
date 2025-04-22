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
        text: 'Others owe you',
        gradient: 'from-green-50 to-green-50/30',
        ringColor: 'ring-green-200/50',
      };
    } else if (netBalance < 0) {
      return {
        icon: <ChevronDown className="h-5 w-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        border: 'border-red-100',
        text: 'You owe others',
        gradient: 'from-red-50 to-red-50/30',
        ringColor: 'ring-red-200/50',
      };
    } else {
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        border: 'border-primary/20',
        text: 'All settled up',
        gradient: 'from-primary/10 to-primary/5',
        ringColor: 'ring-primary/20',
      };
    }
  };

  const { icon, color, bgColor, text, gradient, ringColor } = getStatusInfo();

  return (
    <Card className="border border-gray-200 shadow-sm card-hover-effect rounded-lg overflow-hidden sm:col-span-2 lg:col-span-1 flex flex-col animate-subtle-scale">
      <CardHeader className="pb-3 pt-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2 truncate">
            <DollarSign size={16} className="text-primary flex-shrink-0" />
            <span className="truncate">Your Balance</span>
          </CardTitle>
          {netBalance !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 -mr-2 flex-shrink-0 text-primary hover:text-primary/80 focus-ring"
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
                  Others owe you{' '}
                  <span className="text-green-600 font-medium">{formatAmount(totalOwed)}</span>
                  .{' '}
                </span>
              )}
              {totalOwe > 0 && (
                <span className="block sm:inline truncate">
                  You owe others{' '}
                  <span className="text-red-600 font-medium">{formatAmount(totalOwe)}</span>.
                </span>
              )}
            </div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6 pb-6 flex-grow flex flex-col justify-center relative overflow-hidden">
        {/* Background gradient effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40`}></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${bgColor} ${color} flex-shrink-0 ring-4 ${ringColor}`}
            >
              {icon}
            </div>
            <span className={`text-2xl sm:text-3xl font-bold ${color} truncate`}>
              {formatAmount(netBalance)}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-600 font-medium truncate">{text}</p>
          </div>
        </div>

        {/* Action button for non-zero balances */}
        {netBalance !== 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 relative z-10">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={`w-full ${color} border-gray-200 focus-ring`}
            >
              <Link href="/payments">{netBalance > 0 ? 'Request Payment' : 'Settle Up'}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
