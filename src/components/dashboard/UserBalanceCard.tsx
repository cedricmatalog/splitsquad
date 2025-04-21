'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronUp, ChevronDown, CheckCircle, ArrowRight, DollarSign } from 'lucide-react';
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

  const { icon, color, bgColor, border, text } = getStatusInfo();

  return (
    <Card
      className={`overflow-hidden ${border} hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1`}
    >
      <CardHeader className={`pb-2 ${bgColor} border-b`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <DollarSign size={16} className={color} />
            Your Balance
          </CardTitle>
          {netBalance !== 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 -mr-2" asChild>
              <Link href="/payments" className="flex items-center gap-1 font-medium">
                View Details
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
        {netBalance !== 0 && (
          <CardDescription className="text-xs mt-1">
            {totalOwed > 0 && (
              <span className="block sm:inline">You are owed {formatAmount(totalOwed)}. </span>
            )}
            {totalOwe > 0 && (
              <span className="block sm:inline">You owe {formatAmount(totalOwe)}.</span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${bgColor} ${color}`}>{icon}</div>
          <span className={`text-2xl sm:text-3xl font-bold ${color}`}>
            {formatAmount(netBalance)}
          </span>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600 font-medium">{text}</p>
        </div>
      </CardContent>
    </Card>
  );
}
