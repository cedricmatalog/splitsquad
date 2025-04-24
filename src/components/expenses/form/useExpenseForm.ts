'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { Expense, ExpenseParticipant } from '@/types';
import { createExpense, updateExpense } from '@/services/expenses';
import { replaceExpenseParticipants } from '@/services/expense_participants';
import { validateExpenseForm } from './ExpenseFormCalculations';
import { useShareCalculation } from './useShareCalculation';

interface UseExpenseFormProps {
  initialGroupId?: string;
  expense?: Expense;
  expenseParticipants?: ExpenseParticipant[];
  isEditing?: boolean;
}

export function useExpenseForm({
  initialGroupId,
  expense,
  expenseParticipants,
  isEditing = false,
}: UseExpenseFormProps) {
  const router = useRouter();
  const { groups, users, currentUser, groupMembers, refreshData } = useAppContext();
  const { getGroupMembers } = useExpenseCalculations();

  // Form state
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || expense?.groupId || '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy || currentUser?.id || '');
  const [date, setDate] = useState<Date>(expense?.date ? new Date(expense.date) : new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // Add a ref to track initialization
  const initializedRef = useRef(false);

  // Initialize share calculation hook
  const shareCalculation = useShareCalculation();
  const { shares, setSplitType, initializeSharesForGroup, recalculateShares, setShares } =
    shareCalculation;

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

  // Memoized group members to prevent recalculation
  const groupMembersMemo = useMemo(() => {
    if (!selectedGroupId) return [];
    return getGroupMembers(selectedGroupId);
  }, [selectedGroupId, getGroupMembers]);

  // Initialize shares once when component mounts
  useEffect(() => {
    // Skip if we've already initialized shares or if we don't have a selected group
    if (initializedRef.current || !selectedGroupId) return;

    // Only initialize if we have a selected group
    if (isEditing && expenseParticipants && expenseParticipants.length > 0) {
      // Mark as initialized to prevent infinite loop
      initializedRef.current = true;

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

      // Set shares directly instead of using shareCalculation.setShares
      setShares(existingShares);

      // Check if shares are equal
      const firstShareValue = existingShares.find(s => s.share > 0)?.share || 0;
      const activeShares = existingShares.filter(s => s.share > 0);
      const isEqual = activeShares.every(s => Math.abs(s.share - firstShareValue) < 0.01);

      setSplitType(isEqual ? 'equal' : 'custom');
    } else if (!isEditing) {
      // For new expense, set up initial shares based on amount
      const amountValue = parseFloat(amount);
      if (!isNaN(amountValue) && amountValue > 0) {
        // Mark as initialized to prevent infinite loop
        initializedRef.current = true;

        const memberIds = groupMembersMemo.map(member => member.id);
        initializeSharesForGroup(memberIds, amountValue);
      }
    }
  }, [
    selectedGroupId,
    groupMembersMemo,
    isEditing,
    expenseParticipants,
    amount,
    initializeSharesForGroup,
    setSplitType,
    setShares,
  ]);

  // Handle selecting a group
  const handleGroupChange = useCallback(
    (groupId: string) => {
      setSelectedGroupId(groupId);

      if (!groupId) return;

      // Update shares based on new group members
      const members = getGroupMembers(groupId);
      const memberIds = members.map(member => member.id);
      const amountValue = parseFloat(amount);

      if (!isNaN(amountValue) && amountValue > 0) {
        initializeSharesForGroup(memberIds, amountValue);
      }
    },
    [getGroupMembers, amount, initializeSharesForGroup]
  );

  // Handle amount changes
  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value);

      if (!selectedGroupId) return;

      const amountValue = parseFloat(value);
      if (isNaN(amountValue) || amountValue <= 0) return;

      const memberIds = groupMembersMemo.map(member => member.id);
      recalculateShares(memberIds, amountValue);
    },
    [selectedGroupId, groupMembersMemo, recalculateShares]
  );

  // Handle split type changes
  const handleSplitTypeChange = useCallback(
    (newSplitType: 'equal' | 'custom') => {
      const amountValue = parseFloat(amount);
      const memberIds = groupMembersMemo.map(member => member.id);

      shareCalculation.changeSplitType(newSplitType as 'equal' | 'custom', amountValue, memberIds);
    },
    [amount, groupMembersMemo, shareCalculation]
  );

  // Helper to get user name by ID
  const getUserName = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user ? user.name : 'Unknown';
    },
    [users]
  );

  // Helper to get user avatar by ID
  const getUserAvatar = useCallback(
    (userId: string) => {
      const user = users.find(user => user.id === userId);
      return user ? user.avatar : '';
    },
    [users]
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

  return {
    // Form state
    description,
    setDescription,
    amount,
    setAmount,
    selectedGroupId,
    setSelectedGroupId,
    paidBy,
    setPaidBy,
    date,
    setDate,
    isSubmitting,
    errors,

    // Derived data
    userGroups,
    groupMembersMemo,

    // Share calculation
    ...shareCalculation,

    // Event handlers
    handleGroupChange,
    handleAmountChange,
    handleSplitTypeChange,
    handleSubmit,

    // Helpers
    getUserName,
    getUserAvatar,

    // Navigation
    router,
  };
}
