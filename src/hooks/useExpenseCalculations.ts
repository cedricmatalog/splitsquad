'use client';

import { useAppContext } from '@/context/AppContext';
import { Expense, ExpenseParticipant, Payment, User } from '@/types';

interface Balance {
  userId: string;
  userName: string;
  amount: number;
}

interface GroupBalance {
  groupId: string;
  balances: Balance[];
}

export default function useExpenseCalculations() {
  const { 
    users, 
    groups, 
    expenses, 
    groupMembers, 
    expenseParticipants, 
    payments,
    currentUser
  } = useAppContext();

  // Find user by ID
  const findUser = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

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

  // Calculate balances for a specific group
  const calculateGroupBalances = (groupId: string): Balance[] => {
    const groupExpenses = getGroupExpenses(groupId);
    const groupPaymentsList = getGroupPayments(groupId);
    const balances: Record<string, number> = {};
    
    // Initialize balances for all group members
    getGroupMembers(groupId).forEach(member => {
      balances[member.id] = 0;
    });

    // Calculate from expenses
    groupExpenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const participants = getExpenseParticipants(expense.id);
      
      // Add the full amount to the payer
      balances[paidBy] = (balances[paidBy] || 0) + expense.amount;
      
      // Subtract each participant's share
      participants.forEach(participant => {
        balances[participant.userId] = (balances[participant.userId] || 0) - participant.share;
      });
    });

    // Adjust for payments
    groupPaymentsList.forEach(payment => {
      balances[payment.fromUser] = (balances[payment.fromUser] || 0) - payment.amount;
      balances[payment.toUser] = (balances[payment.toUser] || 0) + payment.amount;
    });

    // Convert to array format with user names
    return Object.entries(balances).map(([userId, amount]) => {
      const user = findUser(userId);
      return {
        userId,
        userName: user ? user.name : 'Unknown User',
        amount: parseFloat(amount.toFixed(2))
      };
    });
  };

  // Calculate all group balances
  const calculateAllGroupBalances = (): GroupBalance[] => {
    return groups.map(group => ({
      groupId: group.id,
      balances: calculateGroupBalances(group.id)
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
    const positiveBalances = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
    const negativeBalances = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
    
    const payments: { from: string, fromName: string, to: string, toName: string, amount: number }[] = [];
    
    let i = 0;
    let j = 0;
    
    while (i < positiveBalances.length && j < negativeBalances.length) {
      const creditor = positiveBalances[i];
      const debtor = negativeBalances[j];
      
      const amount = Math.min(creditor.amount, -debtor.amount);
      
      if (amount > 0.01) { // Ignore very small amounts
        payments.push({
          from: debtor.userId,
          fromName: debtor.userName,
          to: creditor.userId,
          toName: creditor.userName,
          amount: parseFloat(amount.toFixed(2))
        });
      }
      
      creditor.amount -= amount;
      debtor.amount += amount;
      
      if (Math.abs(creditor.amount) < 0.01) i++;
      if (Math.abs(debtor.amount) < 0.01) j++;
    }
    
    return payments;
  };

  return {
    getGroupExpenses,
    getGroupMembers,
    getExpenseParticipants,
    calculateGroupBalances,
    calculateAllGroupBalances,
    calculateUserTotalBalance,
    calculateSimplifiedPayments
  };
} 