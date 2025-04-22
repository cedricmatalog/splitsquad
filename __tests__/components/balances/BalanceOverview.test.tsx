import { render, screen, fireEvent } from '@testing-library/react';
import { BalanceOverview } from '@/components/balances/BalanceOverview';
import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';

// Mock the hooks
jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('@/hooks/useExpenseCalculations', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the PaymentForm component
jest.mock('@/components/payments/PaymentForm', () => ({
  PaymentForm: ({
    groupId,
    fromUserId,
    toUserId,
    suggestedAmount,
    onSuccess,
  }: {
    groupId: string;
    fromUserId?: string;
    toUserId?: string;
    suggestedAmount?: number;
    onSuccess?: () => void;
  }) => (
    <div data-testid="payment-form">
      <div>Group: {groupId}</div>
      <div>From: {fromUserId}</div>
      <div>To: {toUserId}</div>
      <div>Amount: {suggestedAmount}</div>
      <button data-testid="success-button" onClick={onSuccess}>
        Success
      </button>
    </div>
  ),
}));

describe('BalanceOverview', () => {
  const mockCurrentUser = {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: '/avatars/alex.png',
  };

  const mockCalculateGroupBalances = jest.fn();
  const mockCalculateTotalOwedToUser = jest.fn();
  const mockCalculateTotalUserOwes = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAppContext as jest.Mock).mockReturnValue({
      currentUser: mockCurrentUser,
    });

    (useExpenseCalculations as jest.Mock).mockReturnValue({
      calculateGroupBalances: mockCalculateGroupBalances,
      calculateTotalOwedToUser: mockCalculateTotalOwedToUser,
      calculateTotalUserOwes: mockCalculateTotalUserOwes,
    });
  });

  it('renders balance overview for a group', () => {
    mockCalculateGroupBalances.mockReturnValue([
      { userId: 'user-1', userName: 'Alex Johnson', amount: -25 },
    ]);

    render(<BalanceOverview groupId="group-1" />);

    // Should show user balance with grouped params
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('Your balance in this group')).toBeInTheDocument();

    // Check that group balances were calculated
    expect(mockCalculateGroupBalances).toHaveBeenCalledWith('group-1');

    // Should show "you owe" amount
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('renders global balance overview when no groupId is provided', () => {
    mockCalculateTotalOwedToUser.mockReturnValue(100);
    mockCalculateTotalUserOwes.mockReturnValue(25);

    render(<BalanceOverview />);

    // Should show user balance with global params
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
    expect(screen.getByText('Your overall balance across all groups')).toBeInTheDocument();

    // Check that global balances were calculated
    expect(mockCalculateTotalOwedToUser).toHaveBeenCalledWith('user-1');
    expect(mockCalculateTotalUserOwes).toHaveBeenCalledWith('user-1');

    // Should show both owed and owe amounts
    expect(screen.getByText('$25.00')).toBeInTheDocument(); // You owe
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // You are owed

    // Net balance should be positive
    expect(screen.getByText('Others owe you $75.00')).toBeInTheDocument();
  });

  it('shows payment button when user owes money and showPaymentButton is true', () => {
    mockCalculateGroupBalances.mockReturnValue([
      { userId: 'user-1', userName: 'Alex Johnson', amount: -25 },
    ]);

    render(<BalanceOverview groupId="group-1" showPaymentButton={true} />);

    // Should show the "Record a Payment" button
    expect(screen.getByText('Record a Payment')).toBeInTheDocument();
  });

  it('does not show payment button when showPaymentButton is false', () => {
    mockCalculateGroupBalances.mockReturnValue([
      { userId: 'user-1', userName: 'Alex Johnson', amount: -25 },
    ]);

    render(<BalanceOverview groupId="group-1" showPaymentButton={false} />);

    // Should not show the "Record a Payment" button
    expect(screen.queryByText('Record a Payment')).not.toBeInTheDocument();
  });

  it('does not show payment button when user does not owe money', () => {
    mockCalculateGroupBalances.mockReturnValue([
      { userId: 'user-1', userName: 'Alex Johnson', amount: 25 },
    ]);

    render(<BalanceOverview groupId="group-1" showPaymentButton={true} />);

    // Should not show the "Record a Payment" button
    expect(screen.queryByText('Record a Payment')).not.toBeInTheDocument();
  });

  it('shows payment form when button is clicked', () => {
    mockCalculateGroupBalances.mockReturnValue([
      { userId: 'user-1', userName: 'Alex Johnson', amount: -25 },
      { userId: 'user-2', userName: 'Jamie Smith', amount: 25 },
    ]);

    render(<BalanceOverview groupId="group-1" />);

    // Click the payment button
    fireEvent.click(screen.getByText('Record a Payment'));

    // Payment form should be shown
    expect(screen.getByTestId('payment-form')).toBeInTheDocument();

    // Check the props passed to PaymentForm
    expect(screen.getByText('Group: group-1')).toBeInTheDocument();
    expect(screen.getByText('From: user-1')).toBeInTheDocument();
    expect(screen.getByText('To: user-2')).toBeInTheDocument();
    expect(screen.getByText('Amount: 25')).toBeInTheDocument();
  });

  it('hides payment form when success callback is triggered', () => {
    mockCalculateGroupBalances.mockReturnValue([
      { userId: 'user-1', userName: 'Alex Johnson', amount: -25 },
      { userId: 'user-2', userName: 'Jamie Smith', amount: 25 },
    ]);

    render(<BalanceOverview groupId="group-1" />);

    // Click the payment button to show the form
    fireEvent.click(screen.getByText('Record a Payment'));

    // Payment form should be shown
    expect(screen.getByTestId('payment-form')).toBeInTheDocument();

    // Trigger the success callback
    fireEvent.click(screen.getByTestId('success-button'));

    // Payment form should be hidden
    expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument();
  });

  it('handles case when no suitable payment recipient is found', () => {
    mockCalculateGroupBalances.mockReturnValue([
      { userId: 'user-1', userName: 'Alex Johnson', amount: -25 },
      // No user with positive balance
    ]);

    render(<BalanceOverview groupId="group-1" />);

    // Click the payment button
    fireEvent.click(screen.getByText('Record a Payment'));

    // Payment form should not be shown
    expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument();
  });

  it('returns null when currentUser is null', () => {
    (useAppContext as jest.Mock).mockReturnValue({
      currentUser: null,
    });

    const { container } = render(<BalanceOverview groupId="group-1" />);

    // Component should render nothing
    expect(container.firstChild).toBeNull();
  });
});
