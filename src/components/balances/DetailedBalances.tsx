'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

interface DetailedBalancesProps {
  groupId: string;
}

interface DebtDetail {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export function DetailedBalances({ groupId }: DetailedBalancesProps) {
  const { calculateGroupBalances } = useExpenseCalculations();

  // Get balances for this group
  const balances = calculateGroupBalances(groupId);

  // Calculate detailed balances between each user pair
  const detailedBalances: DebtDetail[] = [];

  // Skip if there are no positive balances (everyone settled)
  const positiveBalances = balances.filter(b => b.amount > 0);

  if (positiveBalances.length > 0) {
    // For each person with positive balance (is owed money)
    positiveBalances.forEach(creditor => {
      // Find people with negative balances (owe money)
      const debtors = balances.filter(b => b.amount < 0);

      // Calculate what portion of their debt is owed to this creditor
      debtors.forEach(debtor => {
        // Proportional amount based on total positive balances
        const totalPositiveBalance = positiveBalances.reduce((sum, b) => sum + b.amount, 0);
        const proportionOfDebt = creditor.amount / totalPositiveBalance;
        const amountOwed = Math.abs(debtor.amount) * proportionOfDebt;

        if (amountOwed > 0.01) {
          // Skip very small amounts
          detailedBalances.push({
            fromId: debtor.userId,
            fromName: debtor.userName,
            toId: creditor.userId,
            toName: creditor.userName,
            amount: parseFloat(amountOwed.toFixed(2)),
          });
        }
      });
    });
  }

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
        <CardTitle>Detailed Balances</CardTitle>
        <CardDescription>Who owes what to whom</CardDescription>
      </CardHeader>
      <CardContent>
        {detailedBalances.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No outstanding balances between members.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedBalances.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{detail.fromName}</TableCell>
                  <TableCell>{detail.toName}</TableCell>
                  <TableCell className="text-right">{formatAmount(detail.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
