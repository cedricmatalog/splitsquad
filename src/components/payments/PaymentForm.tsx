'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppContext } from '@/context/AppContext';
import { Payment } from '@/types';
import { AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { createPayment } from '@/services/payments';

// Import modular components
import {
  PaymentConfirmation,
  PaymentFormSummary,
  PaymentFormField,
  UserSelect,
  AmountInput,
} from './';

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
  const { getGroupMembers } = useExpenseCalculations();

  // Get only group members for the current group
  const groupMembers = useMemo(() => getGroupMembers(groupId), [getGroupMembers, groupId]);

  // Check if provided users are group members
  const isValidFromUser = useMemo(
    () => (fromUserId ? groupMembers.some(member => member.id === fromUserId) : false),
    [fromUserId, groupMembers]
  );

  const isValidToUser = useMemo(
    () => (toUserId ? groupMembers.some(member => member.id === toUserId) : false),
    [toUserId, groupMembers]
  );

  const isCurrentUserGroupMember = useMemo(
    () => (currentUser ? groupMembers.some(member => member.id === currentUser.id) : false),
    [currentUser, groupMembers]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(suggestedAmount);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [fromUser, setFromUser] = useState(
    isValidFromUser
      ? fromUserId
      : isCurrentUserGroupMember
        ? currentUser?.id
        : groupMembers.length > 0
          ? groupMembers[0].id
          : ''
  );
  const [toUser, setToUser] = useState(
    isValidToUser
      ? toUserId
      : groupMembers.length > 1
        ? groupMembers.find(member => member.id !== fromUser)?.id || ''
        : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedPayment, setSubmittedPayment] = useState<Payment | null>(null);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!date) {
      newErrors.date = 'Please select a date';
    }

    if (!fromUser) {
      newErrors.fromUser = 'Please select who is making the payment';
    } else if (!groupMembers.some(member => member.id === fromUser)) {
      newErrors.fromUser = 'Selected user is not a member of this group';
    }

    if (!toUser) {
      newErrors.toUser = 'Please select who is receiving the payment';
    } else if (!groupMembers.some(member => member.id === toUser)) {
      newErrors.toUser = 'Selected user is not a member of this group';
    }

    if (fromUser === toUser) {
      newErrors.toUser = 'Payer and receiver must be different people';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, date, fromUser, toUser, groupMembers]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Additional validation to ensure we have valid user IDs
      if (!fromUser || !toUser) {
        setErrors({
          ...(!fromUser ? { fromUser: 'Please select who is making the payment' } : {}),
          ...(!toUser ? { toUser: 'Please select who is receiving the payment' } : {}),
        });
        return;
      }

      setIsSubmitting(true);

      try {
        // Create new payment object (without ID initially)
        const newPaymentData = {
          fromUser,
          toUser,
          amount,
          date: date.toISOString(),
          groupId,
          paymentMethod: selectedPaymentMethod,
          notes: notes.trim() || undefined,
        };

        // Persist to Supabase
        const persistedPayment = await createPayment(newPaymentData);

        if (!persistedPayment) {
          throw new Error('Failed to record payment');
        }

        // Update context with persisted data
        setPayments(prevPayments => [...prevPayments, persistedPayment]);

        // Show confirmation with the persisted payment
        setSubmittedPayment(persistedPayment);

        // Callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error recording payment:', error);
        setErrors({ submit: 'Failed to record payment. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validateForm,
      fromUser,
      toUser,
      amount,
      date,
      groupId,
      setPayments,
      onSuccess,
      selectedPaymentMethod,
      notes,
    ]
  );

  const resetForm = useCallback(() => {
    setSubmittedPayment(null);
    setAmount(suggestedAmount);
    setDate(new Date());
    setSelectedPaymentMethod('cash');
    setNotes('');

    // Set fromUser with the current user if they're a group member
    const defaultFromUser =
      fromUserId ||
      (currentUser && groupMembers.some(member => member.id === currentUser.id)
        ? currentUser.id
        : '');
    setFromUser(defaultFromUser);

    // Set toUser with the provided toUserId if they're a group member
    const defaultToUser =
      toUserId && groupMembers.some(member => member.id === toUserId) ? toUserId : '';
    setToUser(defaultToUser);

    setErrors({});
  }, [suggestedAmount, fromUserId, toUserId, currentUser, groupMembers]);

  // Helper to get user by ID
  const getUserById = useCallback(
    (userId: string) => {
      return users.find(user => user.id === userId);
    },
    [users]
  );

  const formatAmount = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

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
            <PaymentFormField label="From" error={errors.fromUser}>
              <UserSelect
                label="From"
                value={fromUser || ''}
                onChange={setFromUser}
                users={groupMembers}
                error={errors.fromUser}
                placeholder="Select who is paying"
              />
            </PaymentFormField>

            {/* To User Selection */}
            <PaymentFormField label="To" error={errors.toUser}>
              <UserSelect
                label="To"
                value={toUser || ''}
                onChange={setToUser}
                users={groupMembers}
                error={errors.toUser}
                placeholder="Select who is receiving"
              />
            </PaymentFormField>

            {/* Amount */}
            <PaymentFormField label="Amount" error={errors.amount}>
              <AmountInput value={amount} onChange={setAmount} error={errors.amount} />
            </PaymentFormField>

            {/* Date */}
            <PaymentFormField label="Date" error={errors.date}>
              <DatePicker value={date} onChange={setDate} placeholder="Select payment date" />
            </PaymentFormField>

            {/* Payment Method */}
            <PaymentFormField label="Payment Method">
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
            </PaymentFormField>

            {/* Notes */}
            <PaymentFormField label="Notes (Optional)">
              <textarea
                placeholder="Add notes about this payment"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md border-gray-300 min-h-[80px]"
              />
            </PaymentFormField>
          </div>

          {/* Summary */}
          {fromUser && toUser && amount > 0 && (
            <PaymentFormSummary
              fromUser={fromUser}
              toUser={toUser}
              amount={amount}
              getUserById={getUserById}
              formatAmount={formatAmount}
            />
          )}

          {errors.submit && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.submit}</span>
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
            <Button
              type="submit"
              className="gap-2 w-full"
              disabled={isSubmitting || !isCurrentUserGroupMember}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  <span>Record Payment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
