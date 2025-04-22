import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { User } from '@/types';
import { createPayment } from '@/services/payments'; // Import the service

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock the nanoid library
jest.mock('nanoid', () => ({
  nanoid: () => 'mock-id-123', // Return a predictable ID
}));

// Mock the createPayment service
jest.mock('@/services/payments', () => ({
  createPayment: jest.fn(),
}));

// Mock the AppContext
jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn().mockReturnValue({
    users: [
      {
        id: 'user-1',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        avatar: '/alex.png',
      },
      {
        id: 'user-2',
        name: 'Jamie Smith',
        email: 'jamie@example.com',
        avatar: '/jamie.png',
      },
    ],
    currentUser: {
      id: 'user-1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      avatar: '/alex.png',
    },
    setPayments: jest.fn(),
  }),
}));

// Mock the DatePicker component
jest.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({
    value,
    onChange,
    placeholder,
  }: {
    value: Date;
    onChange: (date: Date) => void;
    placeholder: string;
  }) => (
    <div data-testid="date-picker">
      <input
        type="date"
        data-testid="date-input"
        value={value?.toISOString().split('T')[0]}
        onChange={e => onChange(new Date(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  ),
}));

// Import the mocked useAppContext after mocking it
import { useAppContext } from '@/context/AppContext';

// Mock data
const mockUsers: User[] = [
  { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: '/alex.png' },
  { id: 'user-2', name: 'Jamie Smith', email: 'jamie@example.com', avatar: '/jamie.png' },
];
const mockCurrentUser = mockUsers[0];
const mockSetPayments = jest.fn();

// Define the mock context value
const mockContextValue = {
  users: mockUsers,
  groups: [],
  expenses: [],
  groupMembers: [],
  expenseParticipants: [],
  payments: [],
  setUsers: jest.fn(),
  setGroups: jest.fn(),
  setExpenses: jest.fn(),
  setGroupMembers: jest.fn(),
  setExpenseParticipants: jest.fn(),
  setPayments: mockSetPayments,
  currentUser: mockCurrentUser,
  setCurrentUser: jest.fn(),
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshData: jest.fn(),
};

const mockPaymentProps = {
  groupId: 'group-123',
  fromUserId: 'user-1',
  toUserId: 'user-2',
  suggestedAmount: 50.0,
  onSuccess: jest.fn(),
};

const renderPaymentForm = (props = {}) => {
  // Set the mock return value for useAppContext
  (useAppContext as jest.Mock).mockReturnValue(mockContextValue);

  return render(<PaymentForm {...mockPaymentProps} {...props} />);
};

describe('PaymentForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (createPayment as jest.Mock).mockResolvedValue({
      id: 'payment-mock-id-123',
      amount: 50.0,
      fromUserId: 'user-1',
      toUserId: 'user-2',
      groupId: 'group-123',
      method: 'cash',
      date: new Date().toISOString(),
    });
  });

  it('renders correctly', () => {
    renderPaymentForm();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Record Payment/i })).toBeInTheDocument();
  });

  it('allows amount input', () => {
    renderPaymentForm();
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '75.50' } });
    expect(amountInput).toHaveValue(75.5);
  });

  it('validates form before submitting', async () => {
    renderPaymentForm();
    // Clear the amount field
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Record Payment/i }));

    // Wait for validation
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    });

    expect(createPayment).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    renderPaymentForm();

    // Fill form
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '75.50' } });

    // Select payment method
    const methodSelect = screen.getByDisplayValue('Cash');
    fireEvent.change(methodSelect, { target: { value: 'bank_transfer' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Record Payment/i }));

    // Wait for the form to be submitted
    await waitFor(() => {
      expect(createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 75.5,
          fromUser: 'user-1',
          toUser: 'user-2',
          groupId: 'group-123',
          date: expect.any(String),
        })
      );
    });

    await waitFor(() => {
      expect(mockPaymentProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('shows payment confirmation after submission', async () => {
    renderPaymentForm();

    // Fill form
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '75.50' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Record Payment/i }));

    // Wait for the confirmation message
    await waitFor(() => {
      expect(screen.getByText(/Payment Recorded Successfully/i)).toBeInTheDocument();
    });

    // Dismiss confirmation
    fireEvent.click(screen.getByText(/Close/i));

    // Form should be reset to initial state
    await waitFor(() => {
      expect(mockPaymentProps.onSuccess).toHaveBeenCalled();
    });
  });
});
