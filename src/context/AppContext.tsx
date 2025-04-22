'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { User, Group, Expense, GroupMember, ExpenseParticipant, Payment } from '@/types';
import { signIn, signOut, getCurrentUser } from '@/services/auth';
import { getUsers } from '@/services/users';
import { getGroups } from '@/services/groups';
import { getExpenses } from '@/services/expenses';
import { getGroupMembers } from '@/services/group_members';
import { getExpenseParticipants } from '@/services/expense_participants';
import { getPayments } from '@/services/payments';

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
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // State for all entities
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [expenseParticipants, setExpenseParticipants] = useState<ExpenseParticipant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh all data from Supabase
  const refreshData = useCallback(async () => {
    try {
      // Only fetch data if user is authenticated
      if (currentUser) {
        setIsLoading(true);
        const [
          usersData,
          groupsData,
          expensesData,
          groupMembersData,
          expenseParticipantsData,
          paymentsData,
        ] = await Promise.all([
          getUsers(),
          getGroups(),
          getExpenses(),
          getGroupMembers(),
          getExpenseParticipants(),
          getPayments(),
        ]);

        setUsers(usersData);
        setGroups(groupsData);
        setExpenses(expensesData);
        setGroupMembers(groupMembersData);
        setExpenseParticipants(expenseParticipantsData);
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

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

  // Load data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  // Login function using Supabase
  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
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
  }, []);

  // Logout function using Supabase
  const logout = useCallback(async () => {
    try {
      await signOut();
      setCurrentUser(null);
      // Clear all data
      setUsers([]);
      setGroups([]);
      setExpenses([]);
      setGroupMembers([]);
      setExpenseParticipants([]);
      setPayments([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
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
      refreshData,
    }),
    [
      users,
      groups,
      expenses,
      groupMembers,
      expenseParticipants,
      payments,
      currentUser,
      isLoading,
      login,
      logout,
      refreshData,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Create specialized hooks for specific slices of the context
// to prevent unnecessary re-renders when only one piece changes

export function useUserData() {
  const { currentUser, users, isAuthenticated, isLoading, login, logout } = useAppContext();
  return { currentUser, users, isAuthenticated, isLoading, login, logout };
}

export function useGroupData() {
  const { groups, groupMembers, setGroups, setGroupMembers } = useAppContext();
  return { groups, groupMembers, setGroups, setGroupMembers };
}

export function useExpenseData() {
  const { expenses, expenseParticipants, setExpenses, setExpenseParticipants } = useAppContext();
  return { expenses, expenseParticipants, setExpenses, setExpenseParticipants };
}

export function usePaymentData() {
  const { payments, setPayments } = useAppContext();
  return { payments, setPayments };
}
