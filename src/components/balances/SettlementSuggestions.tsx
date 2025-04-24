'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

interface SettlementSuggestionsProps {
  groupId: string;
}

export function SettlementSuggestions({ groupId }: SettlementSuggestionsProps) {
  const { calculateSimplifiedPayments } = useExpenseCalculations();

  // Get settlement suggestions for this group
  const payments = calculateSimplifiedPayments(groupId);

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement Suggestions</CardTitle>
        <CardDescription>The simplest way to settle all debts</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-center text-gray-500 py-4">All settled up! No payments needed.</p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{payment.fromName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{payment.fromName}</span>
                  <ArrowRight className="mx-2 h-4 w-4 text-gray-400" />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{payment.toName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{payment.toName}</span>
                </div>

                <div>
                  <span className="font-medium text-blue-600">{formatAmount(payment.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
