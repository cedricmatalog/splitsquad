'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { User, Group, Expense, GroupMember, ExpenseParticipant, Payment } from '@/types';

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
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);

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

    // Don't automatically set current user, let them log in first
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Password validation (in a real app, you would use proper hashing)
  // For demo purposes, we use a simple scheme where all users have password "password123"
  const validatePassword = (user: User, password: string): boolean => {
    // In a real app, you would hash the password and compare it
    return password === 'password123';
  };

  // Login function
  const login = async (email: string, password: string): Promise<User | null> => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user && validatePassword(user, password)) {
      setCurrentUser(user);
      return user;
    }

    return null;
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
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
