'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { User, Group, Expense, GroupMember, ExpenseParticipant, Payment } from '@/types';
import { getUsers } from '@/services/users';
import { getGroups } from '@/services/groups';
import { getExpenses } from '@/services/expenses';
import { getGroupMembers } from '@/services/group_members';
import { getExpenseParticipants } from '@/services/expense_participants';
import { getPayments } from '@/services/payments';
import { useAuth } from './AuthContext';

/**
 * Data context properties interface
 * Provides access to all application data entities and operations
 *
 * @interface DataContextType
 */
interface DataContextType {
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
  refreshData: () => Promise<void>;
  isLoading: boolean;
  lastError: string | null;
}

// Create the context with undefined default value
const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Data Provider component
 * Manages all application data, fetches from API, and provides data management functions
 * Depends on AuthProvider to have access to current user information
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to the data context
 * @returns {JSX.Element} Data provider component
 */
export function DataProvider({ children }: { children: ReactNode }) {
  // State for all entities
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [expenseParticipants, setExpenseParticipants] = useState<ExpenseParticipant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Get auth context
  const { currentUser } = useAuth();

  /**
   * Utility function to retry failed API calls
   * Implements exponential backoff for better resilience
   *
   * @template T - The return type of the API function
   * @param {function} fn - The API function to call
   * @param {number} retries - Number of retry attempts
   * @param {number} delay - Initial delay in milliseconds
   * @returns {Promise<T>} The result of the API call
   * @throws {Error} If all retries fail
   */
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

  /**
   * Fetches fresh data from all services
   * Only runs when a user is authenticated
   * Clears data when no user is logged in
   *
   * @returns {Promise<void>}
   */
  const refreshData = useCallback(async () => {
    try {
      // Only fetch data if user is authenticated
      if (currentUser) {
        console.log('Refreshing data for user:', currentUser.id);
        setIsLoading(true);
        setLastError(null); // Clear any previous errors when starting a refresh

        console.log('Making API calls...');
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
        console.log('Updating state with fetched data...');
        setUsers(usersData);
        setGroups(groupsData);
        setExpenses(expensesData);
        setGroupMembers(groupMembersData);
        setExpenseParticipants(expenseParticipantsData);
        setPayments(paymentsData);
        console.log('State updates complete');
      } else {
        console.log('Skipping data refresh - no user is logged in');

        // Clear data when no user is logged in
        setUsers([]);
        setGroups([]);
        setExpenses([]);
        setGroupMembers([]);
        setExpenseParticipants([]);
        setPayments([]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Set error state that can be shown to the user
      setLastError('Failed to load your data. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, withRetry]);

  /**
   * Effect to refresh data when auth state changes
   * Ensures data is loaded whenever a user logs in
   */
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  const value = {
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
    refreshData,
    isLoading,
    lastError,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/**
 * Custom hook for accessing the data context
 * Provides access to all application data and data management functions
 *
 * @returns {DataContextType} The data context value
 * @throws {Error} If used outside of DataProvider
 */
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

/**
 * Specialized hook for working with user data
 *
 * @returns {Object} Object containing users array and setter function
 */
export function useUserData() {
  const { users, setUsers } = useData();
  return { users, setUsers };
}

/**
 * Specialized hook for working with group data
 * Provides groups and related group membership data
 *
 * @returns {Object} Object containing groups, groupMembers and their setter functions
 */
export function useGroupData() {
  const { groups, setGroups, groupMembers, setGroupMembers } = useData();
  return { groups, setGroups, groupMembers, setGroupMembers };
}

/**
 * Specialized hook for working with expense data
 * Provides expenses and related expense participant data
 *
 * @returns {Object} Object containing expenses, expenseParticipants and their setter functions
 */
export function useExpenseData() {
  const { expenses, setExpenses, expenseParticipants, setExpenseParticipants } = useData();
  return { expenses, setExpenses, expenseParticipants, setExpenseParticipants };
}

/**
 * Specialized hook for working with payment data
 *
 * @returns {Object} Object containing payments array and setter function
 */
export function usePaymentData() {
  const { payments, setPayments } = useData();
  return { payments, setPayments };
}
