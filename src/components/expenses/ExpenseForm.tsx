'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense, ExpenseParticipant } from '@/types';
import { createExpense, updateExpense } from '@/services/expenses';
import {
  createExpenseParticipant,
  getExpenseParticipants,
  deleteExpenseParticipantByKeys,
} from '@/services/expense_participants';

interface ExpenseFormProps {
  groupId?: string;
  expense?: Expense;
  expenseParticipants?: ExpenseParticipant[];
  isEditing?: boolean;
}

export function ExpenseForm({
  groupId: initialGroupId,
  expense,
  expenseParticipants,
  isEditing = false,
}: ExpenseFormProps) {
  const router = useRouter();
  const { groups, users, setExpenses, setExpenseParticipants, currentUser } = useAppContext();
  const { getGroupMembers } = useExpenseCalculations();

  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || expense?.groupId || '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy || currentUser?.id || '');
  const [date, setDate] = useState<Date>(expense?.date ? new Date(expense.date) : new Date());
  const [splitType, setSplitType] = useState('equal'); // equal, custom
  const [shares, setShares] = useState<{ userId: string; share: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Memoized group members to prevent recalculation
  const groupMembers = useMemo(() => {
    if (!selectedGroupId) return [];
    return getGroupMembers(selectedGroupId);
  }, [selectedGroupId, getGroupMembers]);

  // Calculate equal shares based on amount and members
  const calculateEqualShares = useCallback((memberIds: string[], amountValue: number) => {
    if (memberIds.length === 0 || isNaN(amountValue)) {
      return [];
    }

    const equalShare = parseFloat((amountValue / memberIds.length).toFixed(2));
    const sharesData = memberIds.map(id => ({
      userId: id,
      share: equalShare,
    }));

    // Adjust first share to account for rounding errors
    const totalShares = sharesData.reduce((sum, share) => sum + share.share, 0);
    const diff = amountValue - totalShares;
    if (Math.abs(diff) > 0.01 && sharesData.length > 0) {
      sharesData[0].share = parseFloat((sharesData[0].share + diff).toFixed(2));
    }

    return sharesData;
  }, []);

  // Initialize shares once when component mounts
  useEffect(() => {
    if (!selectedGroupId) return;

    // Only run this effect once on mount
    if (isEditing && expenseParticipants) {
      // If editing, use existing participants and their shares
      const members = groupMembers;
      const memberIds = members.map(member => member.id);

      const existingShares = memberIds.map(memberId => {
        const participant = expenseParticipants.find(p => p.userId === memberId);
        return {
          userId: memberId,
          share: participant?.share || 0,
        };
      });

      setShares(existingShares);

      // Check if shares are equal
      const firstShare = existingShares[0]?.share;
      const isEqual = existingShares.every(s => Math.abs(s.share - firstShare) < 0.01);
      setSplitType(isEqual ? 'equal' : 'custom');
    } else if (amount && selectedGroupId) {
      // For new expense, set up initial shares based on amount
      handleAmountChange(amount);
    } else {
      // Just initialize empty shares for all members
      setShares(
        groupMembers.map(member => ({
          userId: member.id,
          share: 0,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  // Update equal shares when amount changes
  useEffect(() => {
    if (splitType !== 'equal' || !selectedGroupId || !amount) return;

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) return;

    const memberIds = groupMembers.map(member => member.id);
    const equalShares = calculateEqualShares(memberIds, amountValue);
    setShares(equalShares);
  }, [amount, splitType, selectedGroupId, calculateEqualShares, groupMembers]);

  // Handle selecting a group
  const handleGroupChange = useCallback(
    (groupId: string) => {
      setSelectedGroupId(groupId);

      if (!groupId) {
        setShares([]);
        return;
      }

      // Update shares based on new group members
      const members = getGroupMembers(groupId);

      if (splitType === 'equal' && amount) {
        const amountValue = parseFloat(amount);
        if (!isNaN(amountValue)) {
          const memberIds = members.map(member => member.id);
          const equalShares = calculateEqualShares(memberIds, amountValue);
          setShares(equalShares);
        }
      } else {
        // Initialize with zero shares
        setShares(
          members.map(member => ({
            userId: member.id,
            share: 0,
          }))
        );
      }
    },
    [getGroupMembers, calculateEqualShares, splitType, amount]
  );

  // Handle amount changes
  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value);

      if (splitType !== 'equal' || !selectedGroupId || !value) return;

      const amountValue = parseFloat(value);
      if (isNaN(amountValue)) return;

      const memberIds = groupMembers.map(member => member.id);
      const equalShares = calculateEqualShares(memberIds, amountValue);
      setShares(equalShares);
    },
    [splitType, selectedGroupId, groupMembers, calculateEqualShares]
  );

  // Handle split type changes
  const handleSplitTypeChange = useCallback(
    (newSplitType: string) => {
      setSplitType(newSplitType);

      if (newSplitType === 'equal' && amount && selectedGroupId) {
        const amountValue = parseFloat(amount);
        if (!isNaN(amountValue)) {
          const memberIds = groupMembers.map(member => member.id);
          const equalShares = calculateEqualShares(memberIds, amountValue);
          setShares(equalShares);
        }
      }
    },
    [amount, selectedGroupId, groupMembers, calculateEqualShares]
  );

  // Handle individual share changes
  const handleShareChange = useCallback((userId: string, value: string) => {
    const shareValue = value === '' ? 0 : parseFloat(value);

    setShares(prev =>
      prev.map(share => (share.userId === userId ? { ...share, share: shareValue } : share))
    );

    // If we're changing a share manually, switch to custom split
    setSplitType('custom');
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!selectedGroupId) {
      newErrors.selectedGroupId = 'Please select a group';
    }

    if (!paidBy) {
      newErrors.paidBy = 'Please select who paid';
    }

    if (!date) {
      newErrors.date = 'Please select a date';
    }

    // Check if shares add up to the total amount
    if (amount && !isNaN(parseFloat(amount))) {
      const amountValue = parseFloat(amount);
      const totalShares = shares.reduce((sum, share) => sum + share.share, 0);

      if (Math.abs(totalShares - amountValue) > 0.01) {
        newErrors.shares = 'Shares must add up to the total amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [description, amount, selectedGroupId, paidBy, date, shares]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const expenseData = {
        groupId: selectedGroupId,
        description,
        amount: parseFloat(amount),
        paidBy,
        date: date.toISOString(),
      };

      let persistedExpense: Expense | null = null;

      if (isEditing && expense?.id) {
        // Update existing expense
        persistedExpense = await updateExpense(expense.id, expenseData);
      } else {
        // Create new expense
        persistedExpense = await createExpense(expenseData);
      }

      if (!persistedExpense) {
        throw new Error('Failed to save expense');
      }

      // Handle participants
      const newParticipantsData = shares.map(share => ({
        expenseId: persistedExpense!.id,
        userId: share.userId,
        share: share.share,
      }));

      if (isEditing && expense?.id) {
        // For edits, fetch current participants, delete them, then create new ones
        const currentParticipants = await getExpenseParticipants({ expenseId: expense.id });

        // Use the new delete function
        await Promise.all(
          currentParticipants.map(p => deleteExpenseParticipantByKeys(p.expenseId, p.userId))
        );

        // Recreate participants
        const createdParticipants = await Promise.all(
          newParticipantsData.map(p => createExpenseParticipant(p))
        );
        if (createdParticipants.some(p => p === null)) {
          throw new Error('Failed to update some participants');
        }
      } else {
        // For new expenses, create all participants
        const createdParticipants = await Promise.all(
          newParticipantsData.map(p => createExpenseParticipant(p))
        );
        if (createdParticipants.some(p => p === null)) {
          throw new Error('Failed to create some participants');
        }
      }

      // Update local state AFTER successful Supabase operations
      if (isEditing) {
        setExpenses(prev => prev.map(e => (e.id === persistedExpense!.id ? persistedExpense! : e)));
        // Update participants from context
        setExpenseParticipants(prev => [
          ...prev.filter(p => p.expenseId !== persistedExpense!.id),
          ...(newParticipantsData as ExpenseParticipant[]),
        ]);
      } else {
        setExpenses(prev => [...prev, persistedExpense!]);
        setExpenseParticipants(prev => [...prev, ...(newParticipantsData as ExpenseParticipant[])]);
      }

      router.push(`/groups/${selectedGroupId}`);
    } catch (error) {
      console.error('Error saving expense:', error);
      setErrors({ submit: 'Failed to save expense. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserName = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user ? user.name : 'Unknown';
    },
    [users]
  );

  const getUserAvatar = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user ? user.avatar : '';
    },
    [users]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Expense' : 'New Expense'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update expense details' : 'Enter the details of your expense'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Dinner, Groceries, Rent, etc."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              {errors.description && (
                <p className="text-sm font-medium text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
              />
              {errors.amount && <p className="text-sm font-medium text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <DatePicker value={date} onChange={setDate} placeholder="Select expense date" />
              {errors.date && <p className="text-sm font-medium text-red-500">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Group</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={selectedGroupId}
                onChange={e => handleGroupChange(e.target.value)}
                disabled={isEditing} // Don't allow changing group when editing
              >
                <option value="">Select a group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {errors.selectedGroupId && (
                <p className="text-sm font-medium text-red-500">{errors.selectedGroupId}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Paid by</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={paidBy}
                onChange={e => setPaidBy(e.target.value)}
              >
                <option value="">Select who paid</option>
                {selectedGroupId ? (
                  getGroupMembers(selectedGroupId).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Select a group first
                  </option>
                )}
              </select>
              {errors.paidBy && <p className="text-sm font-medium text-red-500">{errors.paidBy}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Split Type</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={splitType}
                onChange={e => handleSplitTypeChange(e.target.value)}
              >
                <option value="equal">Equal Split</option>
                <option value="custom">Custom Split</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Split Details</label>
              <p className="text-sm text-gray-500">Specify how the expense will be split</p>

              {errors.shares && <p className="text-sm font-medium text-red-500">{errors.shares}</p>}

              <div className="space-y-2 mt-2">
                {shares.map(share => (
                  <div key={share.userId} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getUserAvatar(share.userId)}
                        alt={getUserName(share.userId)}
                      />
                      <AvatarFallback>{getUserName(share.userId).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{getUserName(share.userId)}</p>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.01"
                        value={share.share.toString()}
                        onChange={e => handleShareChange(share.userId, e.target.value)}
                        disabled={splitType === 'equal'}
                        className="text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Expense' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
