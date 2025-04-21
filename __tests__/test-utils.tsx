import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Create a mock component outside the setup function
function MockLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href}>{children}</a>;
}
MockLink.displayName = 'MockLink';

// Setup for Link component mock
export const setupLinkMock = () => {
  jest.mock('next/link', () => MockLink);
};

// Setup for navigation mocks
export const setupNavigationMocks = (pathname = '/dashboard') => {
  jest.mock('next/navigation', () => ({
    usePathname: jest.fn(() => pathname),
    useRouter: () => ({
      push: jest.fn(),
      back: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }),
    useSearchParams: () => ({ get: () => null }),
  }));
};

// Setup for AppContext mock
export const setupAppContextMock = (overrides = {}) => {
  const defaultUsers = [
    { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/alex.png' },
    { id: 'user-2', name: 'Jamie Smith', email: 'jamie@example.com', avatar: '/avatars/jamie.png' },
  ];

  const defaultGroups = [
    {
      id: 'group-1',
      name: 'Test Group',
      description: 'Test description',
      createdBy: 'user-1',
      date: '2023-01-01T00:00:00Z',
    },
  ];

  const defaultGroupMembers = [
    { userId: 'user-1', groupId: 'group-1' },
    { userId: 'user-2', groupId: 'group-1' },
  ];

  const defaultCurrentUser = {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: '/avatars/alex.png',
  };

  jest.mock('@/context/AppContext', () => ({
    useAppContext: () => ({
      users: defaultUsers,
      groups: defaultGroups,
      groupMembers: defaultGroupMembers,
      expenses: [],
      expenseParticipants: [],
      payments: [],
      currentUser: defaultCurrentUser,
      setGroups: jest.fn(),
      setGroupMembers: jest.fn(),
      setExpenses: jest.fn(),
      setExpenseParticipants: jest.fn(),
      setPayments: jest.fn(),
      setUsers: jest.fn(),
      setCurrentUser: jest.fn(),
      ...overrides,
    }),
  }));
};

// Custom render with providers if needed
export function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options });
}
