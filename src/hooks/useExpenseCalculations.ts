'use client';

import { useAppContext } from '@/context/AppContext';
import { Expense, ExpenseParticipant, Payment, User } from '@/types';

interface UserBalance {
  userId: string;
  userName: string;
  amount: number;
}

interface GroupBalance {
  groupId: string;
  balances: UserBalance[];
}

export default function useExpenseCalculations() {
  const { users, groups, expenses, groupMembers, expenseParticipants, payments, currentUser } =
    useAppContext();

  // Get all expenses for a specific group
  const getGroupExpenses = (groupId: string): Expense[] => {
    return expenses.filter(expense => expense.groupId === groupId);
  };

  // Get all members of a specific group
  const getGroupMembers = (groupId: string): User[] => {
    const memberIds = groupMembers
      .filter(member => member.groupId === groupId)
      .map(member => member.userId);

    return users.filter(user => memberIds.includes(user.id));
  };

  // Get all expense participants for a specific expense
  const getExpenseParticipants = (expenseId: string): ExpenseParticipant[] => {
    return expenseParticipants.filter(participant => participant.expenseId === expenseId);
  };

  // Get all payments for a specific group
  const getGroupPayments = (groupId: string): Payment[] => {
    return payments.filter(payment => payment.groupId === groupId);
  };

  // Calculate balances for all users in a group
  const calculateGroupBalances = (groupId: string): UserBalance[] => {
    const members = getGroupMembers(groupId);
    const groupExpenses = getGroupExpenses(groupId);
    const groupPayments = getGroupPayments(groupId);

    // Initialize balances for all members
    const balances: Record<string, number> = {};
    members.forEach(member => {
      balances[member.id] = 0;
    });

    // Process all expenses
    groupExpenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const expenseParticipants = getExpenseParticipants(expense.id);

      // Add the full amount to the payer's balance (they are owed this money)
      balances[paidBy] = (balances[paidBy] || 0) + expense.amount;

      // Subtract each participant's share from their balance (they owe this money)
      expenseParticipants.forEach(participant => {
        balances[participant.userId] = (balances[participant.userId] || 0) - participant.share;
      });
    });

    // Process all payments
    // Note: Payment logic can be confusing. The key things to understand:
    // 1. Positive balance = user is owed money
    // 2. Negative balance = user owes money
    // 3. When someone makes a payment (fromUser), they are paying off debt, so their balance should increase
    // 4. When someone receives a payment (toUser), they are getting paid what's owed, so their balance should decrease
    groupPayments.forEach(payment => {
      // The person who paid (fromUser) is reducing their debt to the receiver
      // (or if they're owed money, they're reducing what they're owed)
      balances[payment.fromUser] = (balances[payment.fromUser] || 0) + payment.amount;

      // The person who received (toUser) is having their balance reduced
      // (they're either owed less or they owe more)
      balances[payment.toUser] = (balances[payment.toUser] || 0) - payment.amount;
    });

    // Convert to array with user details
    return members.map(member => ({
      userId: member.id,
      userName: member.name,
      // Round to 2 decimal places for currency
      amount: parseFloat(balances[member.id].toFixed(2)),
    }));
  };

  // Calculate total owed to a specific user across all groups
  const calculateTotalOwedToUser = (userId: string): number => {
    let totalOwed = 0;

    // Get all groups this user is a member of
    const userGroupIds = groupMembers.filter(gm => gm.userId === userId).map(gm => gm.groupId);

    // For each group, calculate balances and add any positive balance for this user
    userGroupIds.forEach(groupId => {
      const balances = calculateGroupBalances(groupId);
      const userBalance = balances.find(b => b.userId === userId);

      if (userBalance && userBalance.amount > 0) {
        totalOwed += userBalance.amount;
      }
    });

    return parseFloat(totalOwed.toFixed(2));
  };

  // Calculate total a user owes to others across all groups
  const calculateTotalUserOwes = (userId: string): number => {
    let totalOwes = 0;

    // Get all groups this user is a member of
    const userGroupIds = groupMembers.filter(gm => gm.userId === userId).map(gm => gm.groupId);

    // For each group, calculate balances and add any negative balance for this user
    userGroupIds.forEach(groupId => {
      const balances = calculateGroupBalances(groupId);
      const userBalance = balances.find(b => b.userId === userId);

      if (userBalance && userBalance.amount < 0) {
        totalOwes += Math.abs(userBalance.amount);
      }
    });

    return parseFloat(totalOwes.toFixed(2));
  };

  // Calculate all group balances
  const calculateAllGroupBalances = (): GroupBalance[] => {
    return groups.map(group => ({
      groupId: group.id,
      balances: calculateGroupBalances(group.id),
    }));
  };

  // Calculate overall balance for the current user
  const calculateUserTotalBalance = (): number => {
    if (!currentUser) return 0;

    let totalBalance = 0;

    groups.forEach(group => {
      const groupBalances = calculateGroupBalances(group.id);
      const userBalance = groupBalances.find(balance => balance.userId === currentUser.id);
      if (userBalance) {
        totalBalance += userBalance.amount;
      }
    });

    return parseFloat(totalBalance.toFixed(2));
  };

  // Calculate simplified payments to settle debts
  const calculateSimplifiedPayments = (groupId: string) => {
    const balances = calculateGroupBalances(groupId);
    // Negative balances mean these users owe money
    const debtors = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
    // Positive balances mean these users are owed money
    const creditors = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);

    const suggestedPayments: {
      from: string;
      fromName: string;
      to: string;
      toName: string;
      amount: number;
    }[] = [];

    let i = 0; // creditor index
    let j = 0; // debtor index

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      // Find the smaller of what's owed and what can be paid
      const amount = Math.min(creditor.amount, -debtor.amount);

      if (amount > 0.01) {
        // Ignore very small amounts
        suggestedPayments.push({
          from: debtor.userId,
          fromName: debtor.userName,
          to: creditor.userId,
          toName: creditor.userName,
          amount: parseFloat(amount.toFixed(2)),
        });
      }

      creditor.amount -= amount;
      debtor.amount += amount;

      if (Math.abs(creditor.amount) < 0.01) i++;
      if (Math.abs(debtor.amount) < 0.01) j++;
    }

    return suggestedPayments;
  };

  return {
    getGroupExpenses,
    getGroupMembers,
    getExpenseParticipants,
    getGroupPayments,
    calculateGroupBalances,
    calculateAllGroupBalances,
    calculateUserTotalBalance,
    calculateSimplifiedPayments,
    calculateTotalOwedToUser,
    calculateTotalUserOwes,
  };
}
