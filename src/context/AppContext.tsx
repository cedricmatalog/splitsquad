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
  lastError: string | null;
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
  const [lastError, setLastError] = useState<string | null>(null);

  // Add a retry mechanism for API calls
  const withRetry = useCallback(
    async <T,>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        if (retries <= 1) throw error;
        console.warn(`API call failed, retrying (${retries - 1} attempts left)...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1, delay * 1.5);
      }
    },
    []
  );

  // Add debugging to the refreshData function
  const refreshData = useCallback(async () => {
    try {
      // Only fetch data if user is authenticated
      if (currentUser) {
        console.log('Refreshing data for user:', currentUser.id);
        setIsLoading(true);
        setLastError(null); // Clear any previous errors when starting a refresh

        // Create an error state for UI feedback
        const [
          usersData,
          groupsData,
          expensesData,
          groupMembersData,
          expenseParticipantsData,
          paymentsData,
        ] = await Promise.all([
          withRetry(() => getUsers()),
          withRetry(() => getGroups()),
          withRetry(() => getExpenses()),
          withRetry(() => getGroupMembers()),
          withRetry(() => getExpenseParticipants()),
          withRetry(() => getPayments()),
        ]);

        console.log('Data refresh completed successfully:');
        console.log('- Users:', usersData.length);
        console.log('- Groups:', groupsData.length);
        console.log('- Expenses:', expensesData.length);
        console.log('- Group Members:', groupMembersData.length);
        console.log('- Expense Participants:', expenseParticipantsData.length);
        console.log('- Payments:', paymentsData.length);

        // Batch state updates to reduce render cycles
        // Use functional updates to ensure we're working with the latest state
        setUsers(usersData);
        setGroups(groupsData);
        setExpenses(expensesData);
        setGroupMembers(groupMembersData);
        setExpenseParticipants(expenseParticipantsData);
        setPayments(paymentsData);
      } else {
        console.log('Skipping data refresh - no user is logged in');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Set error state that can be shown to the user
      setLastError('Failed to load your data. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, withRetry]);

  // Login function using Supabase
  const login = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      try {
        const user = await signIn(email, password);
        if (user) {
          console.log('User logged in successfully:', user.id);
          setCurrentUser(user);

          // Store in localStorage if in browser environment
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('currentUser', JSON.stringify(user));
            } catch (e) {
              console.error('Error storing user in localStorage:', e);
            }
          }

          // Explicitly refresh data after login
          await refreshData();
        }
        return user;
      } catch (error) {
        console.error('Login error:', error);
        return null;
      }
    },
    [refreshData]
  );

  // Logout function using Supabase
  const logout = useCallback(async () => {
    try {
      console.log('Logging out user');
      await signOut();
      setCurrentUser(null);

      // Remove from localStorage if in browser environment
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('currentUser');
        } catch (e) {
          console.error('Error removing user from localStorage:', e);
        }
      }

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

  // Load current user from Supabase on mount
  useEffect(() => {
    async function loadUser() {
      try {
        console.log('Loading current user from auth service');
        const user = await getCurrentUser();
        if (user) {
          console.log('Found authenticated user:', user.id);
          setCurrentUser(user);

          // Store in localStorage for redundancy if in browser environment
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('currentUser', JSON.stringify(user));
            } catch (e) {
              console.error('Error storing user in localStorage:', e);
            }
          }
        } else {
          console.log('No authenticated user found');

          // Check localStorage as fallback if in browser environment
          if (typeof window !== 'undefined') {
            try {
              const persistedUser = localStorage.getItem('currentUser');
              if (persistedUser) {
                const user = JSON.parse(persistedUser);
                console.log(`Found persisted user in localStorage: ${user.id}`);
                setCurrentUser(user);
              }
            } catch (e) {
              console.error('Error checking localStorage:', e);
            }
          }
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
      console.log('Current user changed, refreshing data');
      refreshData();
    }
  }, [currentUser, refreshData]);

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
      lastError,
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
      lastError,
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
