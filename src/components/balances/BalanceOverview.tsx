'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { PaymentForm } from '@/components/payments/PaymentForm';

interface BalanceOverviewProps {
  groupId?: string;
  showPaymentButton?: boolean;
}

export function BalanceOverview({ groupId, showPaymentButton = true }: BalanceOverviewProps) {
  const { currentUser } = useAppContext();
  const { 
    calculateGroupBalances, 
    calculateTotalOwedToUser, 
    calculateTotalUserOwes 
  } = useExpenseCalculations();
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Format with currency symbol
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!currentUser) {
    return null;
  }

  // If a groupId is provided, show balance for that group
  // Otherwise, show overall balance for the user
  let youOwe = 0;
  let youAreOwed = 0;
  let netBalance = 0;

  if (groupId) {
    const balances = calculateGroupBalances(groupId);
    const userBalance = balances.find(b => b.userId === currentUser.id);
    
    if (userBalance) {
      if (userBalance.amount < 0) {
        youOwe = Math.abs(userBalance.amount);
      } else {
        youAreOwed = userBalance.amount;
      }
      netBalance = userBalance.amount;
    }
  } else {
    youOwe = calculateTotalUserOwes(currentUser.id);
    youAreOwed = calculateTotalOwedToUser(currentUser.id);
    netBalance = youAreOwed - youOwe;
  }

  // Find a suitable "other user" for suggested payment
  // This would be the user with the highest positive balance if current user owes money
  const getSuggestedPaymentInfo = () => {
    if (!groupId || !currentUser || netBalance >= 0) return null;
    
    const balances = calculateGroupBalances(groupId);
    const positiveBalances = balances
      .filter(b => b.userId !== currentUser.id && b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    
    if (positiveBalances.length === 0) return null;
    
    // Suggest paying the person with the highest positive balance
    return {
      toUserId: positiveBalances[0].userId,
      amount: Math.min(Math.abs(netBalance), positiveBalances[0].amount)
    };
  };

  const suggestedPayment = getSuggestedPaymentInfo();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
          <CardDescription>
            {groupId ? 'Your balance in this group' : 'Your overall balance across all groups'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">You owe</span>
              <span className="font-medium text-red-600">{formatCurrency(youOwe)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">You are owed</span>
              <span className="font-medium text-green-600">{formatCurrency(youAreOwed)}</span>
            </div>
            <div className="h-px bg-gray-200 my-1"></div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Net balance</span>
              <div>
                <Badge
                  variant={netBalance < 0 ? 'destructive' : netBalance > 0 ? 'success' : 'secondary'}
                >
                  {netBalance < 0
                    ? `You owe ${formatCurrency(Math.abs(netBalance))}`
                    : netBalance > 0
                    ? `You are owed ${formatCurrency(netBalance)}`
                    : 'Settled up'}
                </Badge>
              </div>
            </div>

            {showPaymentButton && youOwe > 0 && (
              <div className="mt-4">
                <Button 
                  className="w-full" 
                  onClick={() => setShowPaymentForm(true)}
                >
                  Record a Payment
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showPaymentForm && groupId && suggestedPayment && (
        <div className="mt-6">
          <PaymentForm
            groupId={groupId}
            fromUserId={currentUser.id}
            toUserId={suggestedPayment.toUserId}
            suggestedAmount={suggestedPayment.amount}
            onSuccess={() => setShowPaymentForm(false)}
          />
        </div>
      )}
    </>
  );
}
