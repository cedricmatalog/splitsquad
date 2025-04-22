'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppContext } from '@/context/AppContext';
import { Payment, User } from '@/types';
import { PaymentConfirmation } from './PaymentConfirmation';
import { createPayment } from '@/services/payments';
import { DollarSign, AlertCircle, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

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
    (userId: string): User | undefined => {
      return users.find(user => user.id === userId);
    },
    [users]
  );

  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
                {groupMembers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.fromUser && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.fromUser}
                </p>
              )}
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
                {groupMembers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.toUser && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.toUser}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={amount === 0 ? '' : amount}
                  onChange={e => {
                    const value = e.target.value;
                    // If empty, set to 0
                    if (value === '') {
                      setAmount(0);
                    } else {
                      // Otherwise parse as float
                      setAmount(parseFloat(value));
                    }
                  }}
                  className={`w-full pl-10 px-3 py-2 border rounded-md ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.amount}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <div className="relative">
                <DatePicker value={date} onChange={setDate} placeholder="Select payment date" />
              </div>
              {errors.date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.date}
                </p>
              )}
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
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="font-medium text-sm mb-2">Payment Summary</h4>
              <div className="flex items-center justify-center space-x-2">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">{getUserById(fromUser)?.name}</span>
                <div className="flex items-center px-2">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className="mx-2 bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">
                    {formatAmount(amount)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">{getUserById(toUser)?.name}</span>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
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
            <Button type="submit" disabled={isSubmitting} className="min-w-[130px]">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Recording...</span>
                </div>
              ) : (
                'Record Payment'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
