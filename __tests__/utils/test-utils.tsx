import { ReactNode } from 'react';

// Mock for Next.js Link component with display name
export const MockLink = ({ href, children }: { href: string; children: ReactNode }) => {
  return <a href={href}>{children}</a>;
};
MockLink.displayName = 'MockLink';

// Setup for common mocks
export const setupMocks = () => {
  // Mock navigation
  jest.mock('next/navigation', () => ({
    usePathname: jest.fn(() => '/dashboard'),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      back: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    })),
    useSearchParams: () => ({ get: () => null }),
  }));

  // Mock Link component
  jest.mock('next/link', () => MockLink);

  // Mock AppContext
  jest.mock('@/context/AppContext', () => ({
    useAppContext: () => ({
      currentUser: {
        id: 'user-1',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        avatar: '/avatars/alex.png',
      },
      users: [
        {
          id: 'user-1',
          name: 'Alex Johnson',
          email: 'alex@example.com',
          avatar: '/avatars/alex.png',
        },
        {
          id: 'user-2',
          name: 'Jamie Smith',
          email: 'jamie@example.com',
          avatar: '/avatars/jamie.png',
        },
      ],
      groups: [
        {
          id: 'group-1',
          name: 'Test Group',
          description: 'Test description',
          createdBy: 'user-1',
          date: '2023-01-01T00:00:00Z',
        },
      ],
      groupMembers: [
        { userId: 'user-1', groupId: 'group-1' },
        { userId: 'user-2', groupId: 'group-1' },
      ],
      expenses: [],
      expenseParticipants: [],
      payments: [],
      setGroups: jest.fn(),
      setGroupMembers: jest.fn(),
      setExpenses: jest.fn(),
      setExpenseParticipants: jest.fn(),
      setPayments: jest.fn(),
      setUsers: jest.fn(),
      setCurrentUser: jest.fn(),
    }),
  }));
};
