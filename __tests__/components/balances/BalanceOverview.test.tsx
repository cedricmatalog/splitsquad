import { render, screen } from '@testing-library/react';
import { BalanceOverview } from '@/components/balances/BalanceOverview';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

// Mock the useExpenseCalculations hook
jest.mock('@/hooks/useExpenseCalculations', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('BalanceOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders balances correctly', () => {
    // Mock implementation for balances
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateGroupBalances: jest.fn().mockReturnValue([
        { userId: 'user-1', userName: 'Alice', amount: 100.5 },
        { userId: 'user-2', userName: 'Bob', amount: -50.25 },
        { userId: 'user-3', userName: 'Charlie', amount: 0 },
      ]),
    });

    render(<BalanceOverview groupId="group-1" />);

    // Check that the component renders the title
    expect(screen.getByText('Balances')).toBeInTheDocument();

    // Check that user names are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    // Check that the correct balance labels are shown
    expect(screen.getByText('$100.50')).toBeInTheDocument();
    expect(screen.getByText('$50.25')).toBeInTheDocument();

    // Check status texts
    expect(screen.getByText('is owed')).toBeInTheDocument();
    expect(screen.getByText('owes')).toBeInTheDocument();
    expect(screen.getByText('settled up')).toBeInTheDocument();
  });

  it('displays message when no balances', () => {
    // Mock implementation for empty balances
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateGroupBalances: jest.fn().mockReturnValue([]),
    });

    render(<BalanceOverview groupId="group-1" />);

    // Check that the empty state message is displayed
    expect(screen.getByText('No balances to display yet.')).toBeInTheDocument();
  });
});
