'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

interface BalanceOverviewProps {
  groupId: string;
}

export function BalanceOverview({ groupId }: BalanceOverviewProps) {
  const { calculateGroupBalances } = useExpenseCalculations();

  // Get balances for this group
  const balances = calculateGroupBalances(groupId);

  // Format amount with currency symbol and correct coloring
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No balances to display yet.</p>
        ) : (
          <div className="space-y-4">
            {balances.map(balance => (
              <div
                key={balance.userId}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{balance.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{balance.userName}</span>
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`font-medium ${
                      balance.amount > 0
                        ? 'text-green-600'
                        : balance.amount < 0
                          ? 'text-red-600'
                          : ''
                    }`}
                  >
                    {formatAmount(balance.amount)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {balance.amount > 0 ? 'is owed' : balance.amount < 0 ? 'owes' : 'settled up'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
