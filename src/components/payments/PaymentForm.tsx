'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppContext } from '@/context/AppContext';
import { Payment, User } from '@/types';
import { PaymentConfirmation } from './PaymentConfirmation';

interface PaymentFormProps {
  groupId: string;
  fromUserId?: string;
  toUserId?: string;
  suggestedAmount?: number;
  onSuccess?: () => void;
}

type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'other';

export function PaymentForm({
  groupId,
  fromUserId,
  toUserId,
  suggestedAmount = 0,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();
  const { users, currentUser, setPayments } = useAppContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(suggestedAmount);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [fromUser, setFromUser] = useState(fromUserId || currentUser?.id || '');
  const [toUser, setToUser] = useState(toUserId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedPayment, setSubmittedPayment] = useState<Payment | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!date) {
      newErrors.date = 'Please select a date';
    }

    if (!fromUser) {
      newErrors.fromUser = 'Please select who is making the payment';
    }

    if (!toUser) {
      newErrors.toUser = 'Please select who is receiving the payment';
    }

    if (fromUser === toUser) {
      newErrors.toUser = 'Payer and receiver must be different people';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Create new payment object
    const newPayment: Payment = {
      id: `payment-${nanoid(6)}`,
      fromUser,
      toUser,
      amount,
      date: date.toISOString(),
      groupId,
    };

    // Save to context/storage
    setPayments(prevPayments => [...prevPayments, newPayment]);

    setIsSubmitting(false);

    // Show confirmation
    setSubmittedPayment(newPayment);

    // Callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };

  const resetForm = () => {
    setSubmittedPayment(null);
    setAmount(0);
    setDate(new Date());
    setSelectedPaymentMethod('cash');
    setNotes('');
    setFromUser(currentUser?.id || '');
    setToUser('');
  };

  // Helper to get user by ID
  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // If payment was successfully submitted, show confirmation
  if (submittedPayment) {
    return (
      <PaymentConfirmation
        payment={submittedPayment}
        onDismiss={() => {
          resetForm();
          // If no onSuccess was provided, navigate to the group page
          if (!onSuccess) {
            router.push(`/groups/${groupId}`);
          }
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
        <CardDescription>Record a payment between group members</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* From User Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <select
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.fromUser ? 'border-red-500' : 'border-gray-300'
                }`}
                value={fromUser}
                onChange={e => setFromUser(e.target.value)}
              >
                <option value="">Select who is paying</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.fromUser && <p className="text-sm text-red-500">{errors.fromUser}</p>}
            </div>

            {/* To User Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <select
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.toUser ? 'border-red-500' : 'border-gray-300'
                }`}
                value={toUser}
                onChange={e => setToUser(e.target.value)}
              >
                <option value="">Select who is receiving</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.toUser && <p className="text-sm text-red-500">{errors.toUser}</p>}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <DatePicker value={date} onChange={setDate} placeholder="Select payment date" />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <select
                className="w-full px-3 py-2 border rounded-md border-gray-300"
                value={selectedPaymentMethod}
                onChange={e => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea
                placeholder="Add notes about this payment"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md border-gray-300 min-h-[80px]"
              />
            </div>
          </div>

          {/* Summary */}
          {fromUser && toUser && amount > 0 && (
            <div className=" p-4 rounded-md">
              <h4 className="font-medium text-sm mb-2">Payment Summary</h4>
              <p className="text-sm">
                {getUserById(fromUser)?.name} will pay {formatAmount(amount)} to{' '}
                {getUserById(toUser)?.name}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
