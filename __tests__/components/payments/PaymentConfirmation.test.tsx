import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentConfirmation } from '@/components/payments';
import { useAppContext } from '@/context/AppContext';

// Mock useAppContext hook
jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
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

describe('PaymentConfirmation', () => {
  const mockUsers = [
    { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/alex.png' },
    { id: 'user-2', name: 'Jamie Smith', email: 'jamie@example.com', avatar: '/avatars/jamie.png' },
  ];

  const mockPayment = {
    id: 'payment-1',
    fromUser: 'user-1',
    toUser: 'user-2',
    amount: 50,
    date: '2023-07-15T12:00:00Z',
    groupId: 'group-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppContext as jest.Mock).mockReturnValue({
      users: mockUsers,
    });
  });

  it('renders payment confirmation details correctly', () => {
    render(<PaymentConfirmation payment={mockPayment} />);

    // Check for success message
    expect(screen.getByText('Payment Recorded Successfully!')).toBeInTheDocument();

    // Check for payment details
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();

    // Check user names
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('Jamie Smith')).toBeInTheDocument();

    // Check formatted amount
    expect(screen.getByText('$50.00')).toBeInTheDocument();

    // Check for confirmation message
    expect(
      screen.getByText('This payment has been recorded and balances have been updated.')
    ).toBeInTheDocument();
  });

  it('formats the date correctly', () => {
    render(<PaymentConfirmation payment={mockPayment} />);

    // The date format should be like "July 15, 2023"
    expect(screen.getByText('July 15, 2023')).toBeInTheDocument();
  });

  it('calls onDismiss callback when close button is clicked', () => {
    const onDismissMock = jest.fn();
    render(<PaymentConfirmation payment={mockPayment} onDismiss={onDismissMock} />);

    // Click the close button
    fireEvent.click(screen.getByText('Close'));

    // Check that onDismiss was called
    expect(onDismissMock).toHaveBeenCalled();
  });

  it('renders a link to view all payments', () => {
    render(<PaymentConfirmation payment={mockPayment} />);

    const viewAllLink = screen.getByText('View All Payments');
    expect(viewAllLink).toBeInTheDocument();

    // Check that the link has the correct href
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/groups/group-1/payments');
  });

  it('handles missing user information gracefully', () => {
    const paymentWithUnknownUsers = {
      ...mockPayment,
      fromUser: 'unknown-user-1',
      toUser: 'unknown-user-2',
    };

    render(<PaymentConfirmation payment={paymentWithUnknownUsers} />);

    // Should not crash and should still display amount and date
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('July 15, 2023')).toBeInTheDocument();
  });
});
