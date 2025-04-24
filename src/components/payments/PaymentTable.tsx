'use client';

import { Payment } from '@/types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PaymentTableProps {
  payments: Payment[];
  formatDate: (dateString: string) => string;
  formatAmount: (amount: number) => string;
  getUserName: (userId: string) => string;
  canDeletePayment: (paymentId: string) => boolean;
  onDeleteClick: (paymentId: string) => void;
}

export function PaymentTable({
  payments,
  formatDate,
  formatAmount,
  getUserName,
  canDeletePayment,
  onDeleteClick,
}: PaymentTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map(payment => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.date)}</TableCell>
              <TableCell className="font-medium">{getUserName(payment.fromUser)}</TableCell>
              <TableCell>{getUserName(payment.toUser)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatAmount(payment.amount)}
              </TableCell>
              <TableCell>
                {payment.paymentMethod ? (
                  <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {payment.notes ? (
                  <span className="text-sm truncate max-w-[200px] block">{payment.notes}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {canDeletePayment(payment.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteClick(payment.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete payment</span>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
