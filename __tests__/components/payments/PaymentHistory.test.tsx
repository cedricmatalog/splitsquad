import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentHistory } from '@/components/payments';
import { useAppContext } from '@/context/AppContext';

// Mock useAppContext hook
jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      data: null,
      error: null,
    })),
  };
});

describe('PaymentHistory', () => {
  const mockUsers = [
    { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/alex.png' },
    { id: 'user-2', name: 'Jamie Smith', email: 'jamie@example.com', avatar: '/avatars/jamie.png' },
    {
      id: 'user-3',
      name: 'Taylor Brown',
      email: 'taylor@example.com',
      avatar: '/avatars/taylor.png',
    },
  ];

  const mockPayments = [
    {
      id: 'payment-1',
      fromUser: 'user-1',
      toUser: 'user-2',
      amount: 50,
      date: '2023-07-15T12:00:00Z',
      groupId: 'group-1',
    },
    {
      id: 'payment-2',
      fromUser: 'user-2',
      toUser: 'user-3',
      amount: 30,
      date: '2023-07-16T12:00:00Z',
      groupId: 'group-1',
    },
    {
      id: 'payment-3',
      fromUser: 'user-3',
      toUser: 'user-1',
      amount: 75,
      date: '2023-07-14T12:00:00Z',
      groupId: 'group-2',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppContext as jest.Mock).mockReturnValue({
      users: mockUsers,
      payments: mockPayments,
    });
  });

  it('renders payment history with correct title', () => {
    render(<PaymentHistory />);
    expect(screen.getByText('Payment History')).toBeInTheDocument();
    expect(screen.getByText('Record of all payments')).toBeInTheDocument();
  });

  it('shows all payments when no filters applied', () => {
    render(<PaymentHistory />);

    // Check that all payments are displayed
    expect(screen.getAllByRole('row')).toHaveLength(4); // 3 payments + header row

    // In desktop view and mobile view, names may appear multiple times
    const alexInstances = screen.getAllByText('Alex Johnson');
    const jamieInstances = screen.getAllByText('Jamie Smith');
    const taylorInstances = screen.getAllByText('Taylor Brown');

    // Expect at least one instance of each name
    expect(alexInstances.length).toBeGreaterThanOrEqual(1);
    expect(jamieInstances.length).toBeGreaterThanOrEqual(1);
    expect(taylorInstances.length).toBeGreaterThanOrEqual(1);
  });

  it('filters payments by group ID', () => {
    render(<PaymentHistory groupId="group-1" />);

    // Should only show payments from group-1
    expect(screen.getAllByRole('row')).toHaveLength(3); // 2 payments + header row

    // Check for presence of names rather than exact count
    expect(screen.getAllByText('Alex Johnson').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Jamie Smith').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Taylor Brown').length).toBeGreaterThanOrEqual(1);

    // Checking for amounts, but now they can appear in both desktop and mobile views
    const fiftyAmount = screen.getAllByText('$50.00');
    const thirtyAmount = screen.getAllByText('$30.00');
    expect(fiftyAmount.length).toBeGreaterThanOrEqual(1);
    expect(thirtyAmount.length).toBeGreaterThanOrEqual(1);

    // Should not show the $75.00 payment from group-2
    expect(screen.queryByText('$75.00')).not.toBeInTheDocument();
  });

  it('filters payments by user ID', () => {
    render(<PaymentHistory userId="user-1" />);

    // Should only show payments involving user-1
    expect(screen.getAllByRole('row')).toHaveLength(3); // 2 payments + header row

    // Check for presence of names rather than exact counts
    expect(screen.getAllByText('Alex Johnson').length).toBeGreaterThanOrEqual(1);

    // Should not include the payment between user-2 and user-3
    // Amounts can appear in both desktop and mobile views
    const fiftyAmount = screen.getAllByText('$50.00');
    const seventyFiveAmount = screen.getAllByText('$75.00');
    expect(fiftyAmount.length).toBeGreaterThanOrEqual(1);
    expect(seventyFiveAmount.length).toBeGreaterThanOrEqual(1);

    // Should not show the $30.00 payment between user-2 and user-3
    expect(screen.queryByText('$30.00')).not.toBeInTheDocument();
  });

  it('limits the number of payments displayed', () => {
    render(<PaymentHistory limit={2} />);

    // Should only show 2 payments (plus header row)
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('sorts payments in descending order by default (newest first)', () => {
    render(<PaymentHistory />);

    const rows = screen.getAllByRole('row');

    // First row is header, so we start from index 1
    // Default sort is by date descending, so payment-2 (July 16) should be first
    expect(rows[1]).toHaveTextContent('Jamie Smith');
    expect(rows[2]).toHaveTextContent('Alex Johnson');
    expect(rows[3]).toHaveTextContent('Taylor Brown');
  });

  it('toggles sort direction when sort button is clicked', async () => {
    render(<PaymentHistory />);

    // Find and click the sort button
    const sortButton = screen.getByText('Newest first');
    fireEvent.click(sortButton);

    // Wait for the sorting to finish
    await waitFor(
      () => {
        // After sorting is complete, just verify that the date order changed
        const dates = screen.getAllByText(/Jul \d+, 2023/);
        // First date in oldest first sorting should be July 14
        expect(dates[0]).toHaveTextContent('Jul 14, 2023');
      },
      { timeout: 1000 }
    );
  });

  it('displays a message when no payments match the filters', () => {
    render(<PaymentHistory groupId="non-existent-group" />);

    expect(screen.getByText('No payments recorded yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
