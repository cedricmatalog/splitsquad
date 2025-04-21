'use client';

import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { Payment } from '@/types';

interface PaymentConfirmationProps {
  payment: Payment;
  onDismiss?: () => void;
}

export function PaymentConfirmation({ payment, onDismiss }: PaymentConfirmationProps) {
  const { users } = useAppContext();

  const fromUser = users.find(user => user.id === payment.fromUser);
  const toUser = users.find(user => user.id === payment.toUser);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-xl">Payment Recorded Successfully!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm text-gray-500">From</div>
              <div className="text-sm font-medium">{fromUser?.name}</div>

              <div className="text-sm text-gray-500">To</div>
              <div className="text-sm font-medium">{toUser?.name}</div>

              <div className="text-sm text-gray-500">Amount</div>
              <div className="text-sm font-medium">{formatAmount(payment.amount)}</div>

              <div className="text-sm text-gray-500">Date</div>
              <div className="text-sm font-medium">{formatDate(payment.date)}</div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            This payment has been recorded and balances have been updated.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center space-x-4">
        <Button variant="outline" onClick={onDismiss}>
          Close
        </Button>
        <Button asChild>
          <Link href={`/groups/${payment.groupId}/payments`}>
            View All Payments
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 