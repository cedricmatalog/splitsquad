import { render, screen } from '@testing-library/react';
import { UserBalanceCard } from '@/components/dashboard/UserBalanceCard';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

// Mock the useExpenseCalculations hook
jest.mock('@/hooks/useExpenseCalculations', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('UserBalanceCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when user is owed money', () => {
    // Mock implementation for positive balance
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateUserTotalBalance: jest.fn().mockReturnValue(100.5),
    });

    render(<UserBalanceCard />);

    // Check that the component renders
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('$100.50')).toBeInTheDocument();
    expect(screen.getByText('You are owed')).toBeInTheDocument();
  });

  it('renders correctly when user owes money', () => {
    // Mock implementation for negative balance
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateUserTotalBalance: jest.fn().mockReturnValue(-50.25),
    });

    render(<UserBalanceCard />);

    // Check that the component renders
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('$50.25')).toBeInTheDocument();
    expect(screen.getByText('You owe')).toBeInTheDocument();
  });

  it('renders correctly when user is settled up', () => {
    // Mock implementation for zero balance
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateUserTotalBalance: jest.fn().mockReturnValue(0),
    });

    render(<UserBalanceCard />);

    // Check that the component renders
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('All settled up')).toBeInTheDocument();
  });
});
