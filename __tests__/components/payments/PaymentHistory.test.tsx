import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentHistory } from '@/components/payments/PaymentHistory';
import { useAppContext } from '@/context/AppContext';

// Mock useAppContext hook
jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

describe('PaymentHistory', () => {
  const mockUsers = [
    { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/alex.png' },
    { id: 'user-2', name: 'Jamie Smith', email: 'jamie@example.com', avatar: '/avatars/jamie.png' },
    { id: 'user-3', name: 'Taylor Brown', email: 'taylor@example.com', avatar: '/avatars/taylor.png' },
  ];

  const mockPayments = [
    {
      id: 'payment-1',
      fromUser: 'user-1',
      toUser: 'user-2',
      amount: 50,
      date: '2023-07-15T12:00:00Z',
      groupId: 'group-1'
    },
    {
      id: 'payment-2',
      fromUser: 'user-2',
      toUser: 'user-3',
      amount: 30,
      date: '2023-07-16T12:00:00Z',
      groupId: 'group-1'
    },
    {
      id: 'payment-3',
      fromUser: 'user-3',
      toUser: 'user-1',
      amount: 75,
      date: '2023-07-14T12:00:00Z',
      groupId: 'group-2'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppContext as jest.Mock).mockReturnValue({
      users: mockUsers,
      payments: mockPayments
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
    expect(screen.getAllByText('Alex Johnson')).toHaveLength(2);
    expect(screen.getAllByText('Jamie Smith')).toHaveLength(2);
    expect(screen.getAllByText('Taylor Brown')).toHaveLength(2);
  });

  it('filters payments by group ID', () => {
    render(<PaymentHistory groupId="group-1" />);
    
    // Should only show payments from group-1
    expect(screen.getAllByRole('row')).toHaveLength(3); // 2 payments + header row
    expect(screen.getAllByText('Alex Johnson')).toHaveLength(1);
    expect(screen.getAllByText('Jamie Smith')).toHaveLength(2);
    expect(screen.getAllByText('Taylor Brown')).toHaveLength(1);
    
    // Should not show the payment from group-2
    expect(screen.getAllByText(/\$\d+\.\d+/)).toHaveLength(2);
  });

  it('filters payments by user ID', () => {
    render(<PaymentHistory userId="user-1" />);
    
    // Should only show payments involving user-1
    expect(screen.getAllByRole('row')).toHaveLength(3); // 2 payments + header row
    expect(screen.getAllByText('Alex Johnson')).toHaveLength(2);
    
    // Should not include the payment between user-2 and user-3
    const amounts = screen.getAllByText(/\$\d+\.\d+/);
    expect(amounts).toHaveLength(2);
    expect(amounts[0].textContent).toMatch(/\$50\.00/);
    expect(amounts[1].textContent).toMatch(/\$75\.00/);
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

  it('toggles sort direction when sort button is clicked', () => {
    render(<PaymentHistory />);
    
    // Find and click the sort button
    const sortButton = screen.getByText(/Sort/);
    fireEvent.click(sortButton);
    
    // Now the sort should be ascending (oldest first)
    const rows = screen.getAllByRole('row');
    
    // payment-3 (July 14) should now be first
    expect(rows[1]).toHaveTextContent('Taylor Brown');
    expect(rows[2]).toHaveTextContent('Alex Johnson');
    expect(rows[3]).toHaveTextContent('Jamie Smith');
  });

  it('displays a message when no payments match the filters', () => {
    render(<PaymentHistory groupId="non-existent-group" />);
    
    expect(screen.getByText('No payments recorded yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
}); 