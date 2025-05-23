import { render, screen } from '@testing-library/react';
import { UserBalanceCard } from '@/components/dashboard/UserBalanceCard';
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

describe('UserBalanceCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the useAppContext hook
    (useAppContext as jest.Mock).mockReturnValue({
      currentUser: { id: 'user-1', name: 'Alex Johnson' },
    });
  });

  it('renders correctly when user is owed money', () => {
    // Mock implementation for positive balance
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateTotalOwedToUser: jest.fn().mockReturnValue(150.5),
      calculateTotalUserOwes: jest.fn().mockReturnValue(50),
      calculateUserTotalBalance: jest.fn().mockReturnValue(100.5),
    });

    render(<UserBalanceCard />);

    // Check that the component renders
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('$100.50')).toBeInTheDocument(); // 150.50 - 50 = 100.50
    expect(screen.getByText("You're owed money")).toBeInTheDocument();
  });

  it('renders correctly when user owes money', () => {
    // Mock implementation for negative balance
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateTotalOwedToUser: jest.fn().mockReturnValue(10),
      calculateTotalUserOwes: jest.fn().mockReturnValue(60.25),
      calculateUserTotalBalance: jest.fn().mockReturnValue(-50.25),
    });

    render(<UserBalanceCard />);

    // Check that the component renders
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('$50.25')).toBeInTheDocument(); // 60.25 - 10 = 50.25
    expect(screen.getByText('You owe money')).toBeInTheDocument();
  });

  it('renders correctly when user is settled up', () => {
    // Mock implementation for zero balance
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateTotalOwedToUser: jest.fn().mockReturnValue(25),
      calculateTotalUserOwes: jest.fn().mockReturnValue(25),
      calculateUserTotalBalance: jest.fn().mockReturnValue(0),
    });

    render(<UserBalanceCard />);

    // Check that the component renders
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('All settled up!')).toBeInTheDocument();
  });
});
