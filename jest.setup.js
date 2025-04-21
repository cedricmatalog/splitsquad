// Import Jest DOM utilities
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '',
  useSearchParams: () => ({ get: () => null }),
}));

// Mock the useAppContext hook
jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    users: [
      { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/alex.png' },
      { id: 'user-2', name: 'Jamie Smith', email: 'jamie@example.com', avatar: '/avatars/jamie.png' }
    ],
    groups: [
      { id: 'group-1', name: 'Test Group', description: 'Test description', createdBy: 'user-1', date: '2023-01-01T00:00:00Z' }
    ],
    groupMembers: [
      { userId: 'user-1', groupId: 'group-1' },
      { userId: 'user-2', groupId: 'group-1' }
    ],
    expenses: [],
    expenseParticipants: [],
    payments: [],
    currentUser: { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/alex.png' },
    setGroups: jest.fn(),
    setGroupMembers: jest.fn(),
    setExpenses: jest.fn(),
    setExpenseParticipants: jest.fn(),
    setPayments: jest.fn(),
    setUsers: jest.fn(),
    setCurrentUser: jest.fn()
  }),
}));

// Mock useExpenseCalculations hook
jest.mock('@/hooks/useExpenseCalculations', () => ({
  __esModule: true,
  default: () => ({
    getGroupExpenses: () => [],
    getGroupMembers: () => [
      { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/alex.png' },
      { id: 'user-2', name: 'Jamie Smith', email: 'jamie@example.com', avatar: '/avatars/jamie.png' }
    ],
    getExpenseParticipants: () => [],
    calculateGroupBalances: () => [],
    calculateAllGroupBalances: () => [],
    calculateUserTotalBalance: () => 0,
    calculateSimplifiedPayments: () => []
  })
})); 