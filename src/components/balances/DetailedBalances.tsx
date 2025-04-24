'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { Button } from '@/components/ui';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import Link from 'next/link';
import React, { useCallback, useMemo } from 'react';

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

function DetailedBalancesComponent({ groupId }: DetailedBalancesProps) {
  const { calculateGroupBalances } = useExpenseCalculations();

  // Memoize balance calculations
  const balances = useMemo(
    () => calculateGroupBalances(groupId),
    [calculateGroupBalances, groupId]
  );

  // Format amount with currency symbol - memoize to prevent recreating on each render
  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  // Memoize the detailed balances calculation
  const { detailedBalances, showRecordPaymentButton } = useMemo(() => {
    const result: DebtDetail[] = [];

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
            result.push({
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

    return {
      detailedBalances: result,
      showRecordPaymentButton: result.length > 0,
    };
  }, [balances]);

  // Memoize the table rows to prevent recreating on each render
  const tableRows = useMemo(
    () =>
      detailedBalances.map((detail, index) => (
        <TableRow key={index}>
          <TableCell className="font-medium">{detail.fromName}</TableCell>
          <TableCell>{detail.toName}</TableCell>
          <TableCell className="text-right">{formatAmount(detail.amount)}</TableCell>
        </TableRow>
      )),
    [detailedBalances, formatAmount]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Detailed Balances</CardTitle>
          <CardDescription>Who owes what to whom</CardDescription>
        </div>
        {showRecordPaymentButton && (
          <Button asChild>
            <Link href={`/groups/${groupId}/payments/new`}>Record Payment</Link>
          </Button>
        )}
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
            <TableBody>{tableRows}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const DetailedBalances = React.memo(DetailedBalancesComponent);
