'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { User, Group, Expense, GroupMember, ExpenseParticipant, Payment } from '@/types';
import { signIn, signOut, getCurrentUser } from '@/services/auth';

// Import mock data
import usersData from '@/data/users.json';
import groupsData from '@/data/groups.json';
import expensesData from '@/data/expenses.json';
import groupMembersData from '@/data/groupMembers.json';
import expenseParticipantsData from '@/data/expenseParticipants.json';
import paymentsData from '@/data/payments.json';

interface AppContextType {
  users: User[];
  groups: Group[];
  expenses: Expense[];
  groupMembers: GroupMember[];
  expenseParticipants: ExpenseParticipant[];
  payments: Payment[];
  setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
  setGroups: (groups: Group[] | ((prev: Group[]) => Group[])) => void;
  setExpenses: (expenses: Expense[] | ((prev: Expense[]) => Expense[])) => void;
  setGroupMembers: (groupMembers: GroupMember[] | ((prev: GroupMember[]) => GroupMember[])) => void;
  setExpenseParticipants: (
    expenseParticipants:
      | ExpenseParticipant[]
      | ((prev: ExpenseParticipant[]) => ExpenseParticipant[])
  ) => void;
  setPayments: (payments: Payment[] | ((prev: Payment[]) => Payment[])) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [groups, setGroups] = useLocalStorage<Group[]>('groups', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [groupMembers, setGroupMembers] = useLocalStorage<GroupMember[]>('groupMembers', []);
  const [expenseParticipants, setExpenseParticipants] = useLocalStorage<ExpenseParticipant[]>(
    'expenseParticipants',
    []
  );
  const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from mock data if localStorage is empty
  useEffect(() => {
    if (users.length === 0) {
      setUsers(usersData);
    }
    if (groups.length === 0) {
      setGroups(groupsData);
    }
    if (expenses.length === 0) {
      setExpenses(expensesData);
    }
    if (groupMembers.length === 0) {
      setGroupMembers(groupMembersData);
    }
    if (expenseParticipants.length === 0) {
      setExpenseParticipants(expenseParticipantsData);
    }
    if (payments.length === 0) {
      setPayments(paymentsData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load current user from Supabase on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  // Login function using Supabase
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const user = await signIn(email, password);
      if (user) {
        setCurrentUser(user);
      }
      return user;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  // Logout function using Supabase
  const logout = async () => {
    try {
      await signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        groups,
        expenses,
        groupMembers,
        expenseParticipants,
        payments,
        setUsers,
        setGroups,
        setExpenses,
        setGroupMembers,
        setExpenseParticipants,
        setPayments,
        currentUser,
        setCurrentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
