'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Expense, ExpenseParticipant } from '@/types';
import { createExpense, updateExpense } from '@/services/expenses';
import { replaceExpenseParticipants } from '@/services/expense_participants';
import { ExpenseFormHeader } from './ExpenseFormHeader';
import { ExpenseFormShares } from './ExpenseFormShares';
import { calculateEqualShares, validateExpenseForm } from './ExpenseFormCalculations';

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
  const { groups, users, currentUser, groupMembers, refreshData } = useAppContext();
  const { getGroupMembers } = useExpenseCalculations();

  // Filter groups to only show those the user is a member of
  const userGroups = useMemo(() => {
    if (!currentUser) return [];
    return groups.filter(
      group =>
        // User created the group
        group.createdBy === currentUser.id ||
        // User is a member of the group
        groupMembers.some(member => member.userId === currentUser.id && member.groupId === group.id)
    );
  }, [groups, currentUser, groupMembers]);

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
  const groupMembersMemo = useMemo(() => {
    if (!selectedGroupId) return [];
    return getGroupMembers(selectedGroupId);
  }, [selectedGroupId, getGroupMembers]);

  // Initialize shares once when component mounts
  useEffect(() => {
    if (!selectedGroupId) return;

    // Only initialize if we have a selected group and values not already set
    if (isEditing && expenseParticipants && expenseParticipants.length > 0) {
      // If editing, use existing participants and their shares
      const members = groupMembersMemo;
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
    } else if (amount && selectedGroupId && shares.length === 0) {
      // For new expense, set up initial shares based on amount
      const amountValue = parseFloat(amount);
      if (!isNaN(amountValue)) {
        const memberIds = groupMembersMemo.map(member => member.id);
        const equalShares = calculateEqualShares(memberIds, amountValue);
        setShares(equalShares);
      }
    }
  }, [selectedGroupId, groupMembersMemo, isEditing, expenseParticipants, amount, shares.length]);

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
        // Initialize shares based on split type
        const defaultShares = members.map(member => ({
          userId: member.id,
          share: 0, // Start with zero for all
        }));

        setShares(defaultShares);

        // For equal split, compute equal shares immediately to include all members by default
        if (splitType === 'equal' && amount) {
          const amountValue = parseFloat(amount);
          if (!isNaN(amountValue)) {
            const memberIds = members.map(member => member.id);
            const equalShares = calculateEqualShares(memberIds, amountValue);
            setShares(equalShares);
          }
        }
      }
    },
    [getGroupMembers, splitType, amount]
  );

  // Handle amount changes
  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value);

      if (splitType !== 'equal' || !selectedGroupId || !value) return;

      const amountValue = parseFloat(value);
      if (isNaN(amountValue)) return;

      // Get currently active members
      const activeMembers = shares.filter(share => share.share > 0).map(share => share.userId);

      // If no members are active (first load), use all members
      const membersToUse =
        activeMembers.length > 0 ? activeMembers : groupMembersMemo.map(member => member.id);

      const equalShares = calculateEqualShares(membersToUse, amountValue);

      // Apply the equal shares but maintain excluded members
      const updatedShares = shares.map(share => {
        // If this member was active or we're starting fresh, update their share
        if (activeMembers.includes(share.userId) || activeMembers.length === 0) {
          const equalShare = equalShares.find(s => s.userId === share.userId);
          return equalShare || share;
        }
        // Otherwise keep their share at 0 (excluded)
        return share;
      });

      setShares(updatedShares);
    },
    [splitType, selectedGroupId, groupMembersMemo, shares]
  );

  // Handle split type changes
  const handleSplitTypeChange = useCallback(
    (newSplitType: string) => {
      setSplitType(newSplitType);

      if (newSplitType === 'equal' && amount && selectedGroupId) {
        const amountValue = parseFloat(amount);
        if (!isNaN(amountValue)) {
          // Get currently active members to maintain who is excluded
          const activeMembers = shares.filter(share => share.share > 0).map(share => share.userId);

          // If no active members (first load), use all members
          const membersToUse =
            activeMembers.length > 0 ? activeMembers : groupMembersMemo.map(member => member.id);

          const equalShares = calculateEqualShares(membersToUse, amountValue);

          // Apply the equal shares but maintain excluded members
          const updatedShares = shares.map(share => {
            // If this member was active or we're starting fresh, update their share
            if (activeMembers.includes(share.userId) || activeMembers.length === 0) {
              const equalShare = equalShares.find(s => s.userId === share.userId);
              return equalShare || share;
            }
            // Otherwise keep their share at 0 (excluded)
            return share;
          });

          setShares(updatedShares);
        }
      }
    },
    [amount, selectedGroupId, groupMembersMemo, shares]
  );

  // Handle individual share changes
  const handleShareChange = useCallback((userId: string, value: string) => {
    const shareValue = value === '' ? 0 : parseFloat(value);

    setShares(prev =>
      prev.map(share => (share.userId === userId ? { ...share, share: shareValue } : share))
    );

    // Switch to custom split when manually changing shares
    setSplitType('custom');
  }, []);

  // Handle member toggling (include/exclude from split)
  const handleMemberToggle = useCallback(
    (userId: string, isEnabled: boolean) => {
      // If enabling, assign an equal share; if disabling, set share to 0
      const amountValue = parseFloat(amount);

      if (isEnabled && !isNaN(amountValue)) {
        // Count currently active members to calculate new share
        const currentActiveCount =
          shares.filter(s => s.userId !== userId && s.share > 0).length + 1;
        const newEqualShare = amountValue / currentActiveCount;

        // Update all active shares to be equal
        const activeMembers = shares
          .filter(s => s.userId === userId || s.share > 0)
          .map(s => s.userId);

        const updatedShares = shares.map(share => {
          if (activeMembers.includes(share.userId)) {
            return { ...share, share: parseFloat(newEqualShare.toFixed(2)) };
          }
          return share;
        });

        // Adjust first share to account for rounding errors
        const totalShares = updatedShares.reduce((sum, share) => sum + share.share, 0);
        const diff = amountValue - totalShares;
        if (Math.abs(diff) > 0.01) {
          const firstActiveIndex = updatedShares.findIndex(s => activeMembers.includes(s.userId));
          if (firstActiveIndex >= 0) {
            updatedShares[firstActiveIndex].share = parseFloat(
              (updatedShares[firstActiveIndex].share + diff).toFixed(2)
            );
          }
        }

        setShares(updatedShares);
      } else {
        // Just disable this member by setting share to 0
        setShares(prev =>
          prev.map(share => (share.userId === userId ? { ...share, share: 0 } : share))
        );

        // If there are other active members and we're disabling one, redistribute
        const activeShares = shares.filter(s => s.userId !== userId && s.share > 0);
        if (activeShares.length > 0 && !isNaN(amountValue)) {
          const newEqualShare = amountValue / activeShares.length;

          const updatedShares = shares.map(share => {
            if (share.userId !== userId && share.share > 0) {
              return { ...share, share: parseFloat(newEqualShare.toFixed(2)) };
            }
            return share;
          });

          // Adjust first share to account for rounding errors
          const totalShares = updatedShares.reduce((sum, share) => sum + share.share, 0);
          const diff = amountValue - totalShares;
          if (Math.abs(diff) > 0.01) {
            const firstActiveIndex = updatedShares.findIndex(
              s => s.userId !== userId && s.share > 0
            );
            if (firstActiveIndex >= 0) {
              updatedShares[firstActiveIndex].share = parseFloat(
                (updatedShares[firstActiveIndex].share + diff).toFixed(2)
              );
            }
          }

          setShares(updatedShares);
        }
      }
    },
    [amount, shares]
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      const validationErrors = validateExpenseForm(
        description,
        amount,
        selectedGroupId,
        paidBy,
        shares
      );

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      const amountValue = parseFloat(amount);
      const expenseData = {
        id: expense?.id,
        groupId: selectedGroupId,
        description,
        amount: amountValue,
        paidBy,
        date: date.toISOString(),
      };

      // Include only those with shares > 0
      const participantsData = shares
        .filter(share => share.share > 0)
        .map(share => ({
          userId: share.userId,
          expenseId: expense?.id || '', // If creating new, this will be filled in by the service
          share: share.share,
        }));

      if (isEditing && expense) {
        // Update existing expense
        await updateExpense(expense.id, expenseData);
        await replaceExpenseParticipants(expense.id, participantsData);
      } else {
        // Create new expense
        const newExpense = await createExpense(expenseData);
        if (!newExpense) {
          throw new Error('Failed to create expense');
        }
        await replaceExpenseParticipants(newExpense.id, participantsData);
      }

      // Refresh data and navigate back
      await refreshData();
      router.back();
    } catch (error) {
      console.error('Error saving expense:', error);
      setErrors({ submit: 'Failed to save expense. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Unknown';
  };

  // Helper to get user avatar by ID
  const getUserAvatar = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.avatar : '';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <ExpenseFormHeader isEditing={isEditing} />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Dinner, Groceries, Rent, etc."
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm font-medium text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`pl-7 ${errors.amount ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.amount && <p className="text-sm font-medium text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Group</label>
              <select
                value={selectedGroupId}
                onChange={e => handleGroupChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.group ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select a group</option>
                {userGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {errors.group && <p className="text-sm font-medium text-red-500">{errors.group}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Paid By</label>
              <select
                value={paidBy}
                onChange={e => setPaidBy(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.paidBy ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select who paid</option>
                {groupMembersMemo.map(member => (
                  <option key={member.id} value={member.id}>
                    {getUserName(member.id)}
                    {member.id === currentUser?.id ? ' (You)' : ''}
                  </option>
                ))}
              </select>
              {errors.paidBy && <p className="text-sm font-medium text-red-500">{errors.paidBy}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <DatePicker value={date} onChange={setDate} />
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
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Split Details</label>
                <p className="text-xs text-gray-500">
                  {splitType === 'equal'
                    ? 'Use checkboxes to include/exclude members'
                    : 'Customize each share amount'}
                </p>
              </div>

              {errors.shares && <p className="text-sm font-medium text-red-500">{errors.shares}</p>}

              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {shares.map(share => (
                  <ExpenseFormShares
                    key={share.userId}
                    userId={share.userId}
                    userName={getUserName(share.userId)}
                    userAvatar={getUserAvatar(share.userId)}
                    share={share.share}
                    totalAmount={parseFloat(amount) || 0}
                    splitType={splitType}
                    onShareChange={handleShareChange}
                    onMemberToggle={handleMemberToggle}
                  />
                ))}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
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
