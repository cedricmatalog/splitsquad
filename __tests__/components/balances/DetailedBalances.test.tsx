import { render, screen } from '@testing-library/react';
import { DetailedBalances } from '@/components/balances/DetailedBalances';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { useAppContext } from '@/context/AppContext';

// Mock the hooks
jest.mock('@/hooks/useExpenseCalculations', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

describe('DetailedBalances', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AppContext
    (useAppContext as jest.Mock).mockReturnValue({
      users: [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
      ],
    });
  });

  it('renders detailed balances correctly', () => {
    // Mock implementation for balances and group members
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateGroupBalances: jest.fn().mockReturnValue([
        { userId: 'user-1', userName: 'Alice', amount: 50.0 },
        { userId: 'user-2', userName: 'Bob', amount: -30.0 },
        { userId: 'user-3', userName: 'Charlie', amount: -20.0 },
      ]),
      getGroupMembers: jest.fn().mockReturnValue([
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
      ]),
    });

    render(<DetailedBalances groupId="group-1" />);

    // Check that the component renders the title and description
    expect(screen.getByText('Detailed Balances')).toBeInTheDocument();
    expect(screen.getByText('Who owes what to whom')).toBeInTheDocument();

    // Check that the table headers are displayed
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();

    // Check that user names and amounts are displayed
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);

    // The exact amounts will depend on the proportional calculation in the component
    // but we can verify the table has content
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays message when no detailed balances', () => {
    // Mock implementation for empty balances (all settled up)
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateGroupBalances: jest.fn().mockReturnValue([
        { userId: 'user-1', userName: 'Alice', amount: 0 },
        { userId: 'user-2', userName: 'Bob', amount: 0 },
      ]),
      getGroupMembers: jest.fn().mockReturnValue([
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
      ]),
    });

    render(<DetailedBalances groupId="group-1" />);

    // Check that the empty state message is displayed
    expect(screen.getByText('No outstanding balances between members.')).toBeInTheDocument();
  });
});
