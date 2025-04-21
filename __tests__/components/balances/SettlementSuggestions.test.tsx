import { render, screen } from '@testing-library/react';
import { SettlementSuggestions } from '@/components/balances/SettlementSuggestions';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

// Mock the useExpenseCalculations hook
jest.mock('@/hooks/useExpenseCalculations', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('SettlementSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders settlement suggestions correctly', () => {
    // Mock implementation for settlements
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateSimplifiedPayments: jest.fn().mockReturnValue([
        {
          from: 'user-1',
          fromName: 'Alice',
          to: 'user-2',
          toName: 'Bob',
          amount: 30.25,
        },
        {
          from: 'user-3',
          fromName: 'Charlie',
          to: 'user-4',
          toName: 'David',
          amount: 20.0,
        },
      ]),
    });

    render(<SettlementSuggestions groupId="group-1" />);

    // Check that the component renders the title and description
    expect(screen.getByText('Settlement Suggestions')).toBeInTheDocument();
    expect(screen.getByText('The simplest way to settle all debts')).toBeInTheDocument();

    // Check that user names are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('David')).toBeInTheDocument();

    // Check that the correct amounts are shown
    expect(screen.getByText('$30.25')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
  });

  it('displays message when no settlements needed', () => {
    // Mock implementation for empty settlements
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateSimplifiedPayments: jest.fn().mockReturnValue([]),
    });

    render(<SettlementSuggestions groupId="group-1" />);

    // Check that the empty state message is displayed
    expect(screen.getByText('All settled up! No payments needed.')).toBeInTheDocument();
  });
});
