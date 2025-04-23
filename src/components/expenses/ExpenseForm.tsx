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
import { replaceExpenseParticipants } from '@/services/expense_participants';

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
  const {
    groups,
    users,
    setExpenses,
    setExpenseParticipants,
    currentUser,
    groupMembers,
    refreshData,
  } = useAppContext();
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
  }, [
    selectedGroupId,
    groupMembersMemo,
    isEditing,
    expenseParticipants,
    amount,
    calculateEqualShares,
    shares.length,
  ]); // Add dependencies for the effect

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
    [getGroupMembers, calculateEqualShares, splitType, amount]
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

      // Update shares while maintaining excluded members
      const updatedShares = [...shares];
      for (let i = 0; i < updatedShares.length; i++) {
        const share = updatedShares[i];
        // Only update active members
        if (activeMembers.includes(share.userId) || activeMembers.length === 0) {
          const equalShare = equalShares.find(s => s.userId === share.userId);
          if (equalShare) {
            updatedShares[i] = equalShare;
          }
        }
      }

      setShares(updatedShares);
    },
    [splitType, selectedGroupId, groupMembersMemo, calculateEqualShares, shares]
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
    [amount, selectedGroupId, groupMembersMemo, calculateEqualShares, shares]
  );

  // Handle individual share changes
  const handleShareChange = useCallback(
    (userId: string, value: string, maintainSplitType = false) => {
      const shareValue = value === '' ? 0 : parseFloat(value);

      setShares(prev =>
        prev.map(share => (share.userId === userId ? { ...share, share: shareValue } : share))
      );

      // If we're changing a share manually and not specifically maintaining the split type,
      // switch to custom split
      if (!maintainSplitType) {
        setSplitType('custom');
      }
    },
    []
  );

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
      // Only count active participants (share > 0)
      const activeShares = shares.filter(share => share.share > 0);

      if (activeShares.length === 0) {
        newErrors.shares = 'At least one person must participate in the expense';
      } else {
        const totalShares = activeShares.reduce((sum, share) => sum + share.share, 0);

        if (Math.abs(totalShares - amountValue) > 0.01) {
          newErrors.shares = 'Shares must add up to the total amount';
        }
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
      console.log('Saving expense...');
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
        console.log('Updating existing expense:', expense.id);
        persistedExpense = await updateExpense(expense.id, expenseData);
      } else {
        // Create new expense
        console.log('Creating new expense');
        persistedExpense = await createExpense(expenseData);
      }

      if (!persistedExpense) {
        throw new Error('Failed to save expense');
      }

      console.log('Expense saved successfully:', persistedExpense.id);

      // Handle participants
      if (isEditing && expense?.id) {
        // For edits, use the new replace function to update all participants at once
        console.log('Updating expense participants using replacement method');
        try {
          // Prepare simple participant data (without expenseId)
          const participantData = shares.map(share => ({
            userId: share.userId,
            share: share.share,
          }));

          // Replace all participants in one operation
          const success = await replaceExpenseParticipants(persistedExpense.id, participantData);

          if (!success) {
            throw new Error('Failed to update expense participants');
          }

          console.log('Successfully replaced all expense participants');

          // Update expense in local state
          console.log('Updating expense in local state');
          setExpenses(prev =>
            prev.map(e => (e.id === persistedExpense!.id ? persistedExpense! : e))
          );

          // Update participants in context
          setExpenseParticipants(prev => [
            ...prev.filter(p => p.expenseId !== persistedExpense!.id),
            ...participantData.map(p => ({
              ...p,
              expenseId: persistedExpense!.id,
            })),
          ]);
        } catch (participantError: unknown) {
          console.error('Error updating participants:', participantError);
          const errorMessage =
            participantError instanceof Error ? participantError.message : String(participantError);
          throw new Error(`Failed to update participants: ${errorMessage}`);
        }
      } else {
        // For new expenses, create all participants
        console.log('Creating expense participants');
        const newParticipantsData = shares.map(share => ({
          expenseId: persistedExpense.id,
          userId: share.userId,
          share: share.share,
        }));

        try {
          // Use the replace function for new expenses too for consistency
          const success = await replaceExpenseParticipants(
            persistedExpense.id,
            newParticipantsData.map(p => ({
              userId: p.userId,
              share: p.share,
            }))
          );

          if (!success) {
            throw new Error('Failed to create expense participants');
          }

          console.log('Successfully created all expense participants');

          // Add the new expense to context
          console.log('Adding new expense to local state');
          setExpenses(prev => [...prev, persistedExpense!]);

          // Add the new participants to context
          setExpenseParticipants(prev => [...prev, ...newParticipantsData]);
        } catch (participantError: unknown) {
          console.error('Error creating participants:', participantError);
          const errorMessage =
            participantError instanceof Error ? participantError.message : String(participantError);
          throw new Error(`Failed to create participants: ${errorMessage}`);
        }
      }

      // Refresh all data to ensure everything is up-to-date
      console.log('Refreshing all data...');
      try {
        await refreshData();
        console.log('Data refresh complete');

        // Add a small delay to ensure everything is updated
        await new Promise(resolve => setTimeout(resolve, 500));

        // Navigate after state updates and data refresh are done
        console.log('Navigating to group page');
        router.push(`/groups/${selectedGroupId}`);
      } catch (refreshError: unknown) {
        console.error('Error during data refresh:', refreshError);
        // Still navigate even if refresh fails
        router.push(`/groups/${selectedGroupId}`);
      }
    } catch (error: unknown) {
      console.error('Error saving expense:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrors({ submit: `Failed to save expense: ${errorMessage}` });
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
                {userGroups.map(group => (
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
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Split Details</label>
                <p className="text-xs text-gray-500">
                  {splitType === 'equal'
                    ? 'Use checkboxes to include/exclude members'
                    : 'Customize each share amount'}
                </p>
              </div>

              {errors.shares && <p className="text-sm font-medium text-red-500">{errors.shares}</p>}

              <div className="space-y-2 mt-2">
                {shares.map(share => (
                  <div key={share.userId} className="flex items-center gap-3">
                    {/* Toggle participation for equal split */}
                    {splitType === 'equal' && (
                      <div className="flex items-center gap-3">
                        {/* Checkbox for toggling participation */}
                        <div
                          onClick={() => {
                            // Only allow toggling if there would still be at least one active participant
                            const activeCount = shares.filter(s => s.share > 0).length;
                            if (share.share > 0 && activeCount > 1) {
                              // Exclude this member
                              handleShareChange(share.userId, '0', true);

                              // Recalculate shares for remaining members
                              const remainingMembers = shares
                                .filter(s => s.userId !== share.userId && s.share > 0)
                                .map(s => s.userId);

                              if (remainingMembers.length > 0 && amount) {
                                const amountValue = parseFloat(amount);
                                if (!isNaN(amountValue)) {
                                  const equalShares = calculateEqualShares(
                                    remainingMembers,
                                    amountValue
                                  );

                                  // Update shares for remaining members
                                  equalShares.forEach(updatedShare => {
                                    shares.forEach(s => {
                                      if (s.userId === updatedShare.userId) {
                                        handleShareChange(
                                          s.userId,
                                          updatedShare.share.toString(),
                                          true
                                        );
                                      }
                                    });
                                  });
                                }
                              }
                            } else if (share.share === 0) {
                              // Include this member
                              const activeMembers = [
                                ...shares.filter(s => s.share > 0).map(s => s.userId),
                                share.userId,
                              ];

                              if (amount) {
                                const amountValue = parseFloat(amount);
                                if (!isNaN(amountValue)) {
                                  const equalShares = calculateEqualShares(
                                    activeMembers,
                                    amountValue
                                  );

                                  // Update all shares
                                  equalShares.forEach(updatedShare => {
                                    handleShareChange(
                                      updatedShare.userId,
                                      updatedShare.share.toString(),
                                      true
                                    );
                                  });
                                }
                              }
                            }
                          }}
                          className="relative flex items-center justify-center cursor-pointer h-5 w-5 border rounded mr-2"
                          style={{
                            backgroundColor: share.share > 0 ? '#3b82f6' : 'white',
                            borderColor: share.share > 0 ? '#3b82f6' : '#d1d5db',
                          }}
                          title={share.share === 0 ? 'Click to include' : 'Click to exclude'}
                        >
                          {share.share > 0 && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>

                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={getUserAvatar(share.userId)}
                            alt={getUserName(share.userId)}
                          />
                          <AvatarFallback>{getUserName(share.userId).charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    {/* Normal avatar for custom split */}
                    {splitType !== 'equal' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getUserAvatar(share.userId)}
                          alt={getUserName(share.userId)}
                        />
                        <AvatarFallback>{getUserName(share.userId).charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex-1">
                      <p className="text-sm font-medium">{getUserName(share.userId)}</p>
                      {share.share === 0 && splitType === 'equal' && (
                        <p className="text-xs text-gray-500">Not participating</p>
                      )}
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.01"
                        value={share.share.toString()}
                        onChange={e => handleShareChange(share.userId, e.target.value, false)}
                        disabled={splitType === 'equal' && share.share > 0}
                        className={`text-right ${share.share === 0 ? 'bg-gray-100' : ''}`}
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
