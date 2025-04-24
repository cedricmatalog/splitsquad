'use client';

import { Payment } from '@/types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface MobilePaymentListProps {
  payments: Payment[];
  formatDate: (dateString: string) => string;
  formatAmount: (amount: number) => string;
  getUserName: (userId: string) => string;
  canDeletePayment: (paymentId: string) => boolean;
  onDeleteClick: (paymentId: string) => void;
}

export function MobilePaymentList({
  payments,
  formatDate,
  formatAmount,
  getUserName,
  canDeletePayment,
  onDeleteClick,
}: MobilePaymentListProps) {
  return (
    <div className="md:hidden space-y-4">
      {payments.map(payment => (
        <div key={payment.id} className="border rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">{formatDate(payment.date)}</div>
            <div className="font-medium text-right">{formatAmount(payment.amount)}</div>
          </div>

          <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="text-gray-500">From:</div>
            <div className="font-medium">{getUserName(payment.fromUser)}</div>

            <div className="text-gray-500">To:</div>
            <div>{getUserName(payment.toUser)}</div>

            {payment.paymentMethod && (
              <>
                <div className="text-gray-500">Method:</div>
                <div className="capitalize">{payment.paymentMethod.replace('_', ' ')}</div>
              </>
            )}
          </div>

          {payment.notes && (
            <div className="pt-1 border-t mt-2">
              <div className="text-xs text-gray-500 mb-1">Notes:</div>
              <div className="text-sm">{payment.notes}</div>
            </div>
          )}

          {canDeletePayment(payment.id) && (
            <div className="pt-2 mt-2 border-t flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteClick(payment.id)}
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
