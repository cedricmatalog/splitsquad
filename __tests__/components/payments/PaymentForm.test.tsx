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
jest.mock('@/context/AppContext', () => {
  const originalModule = jest.requireActual('@/context/AppContext');
  return {
    ...originalModule,
    useAppContext: jest.fn(),
  };
});

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

const renderPaymentForm = (props = {}) => {
  // Set the mock return value for useAppContext
  (useAppContext as jest.Mock).mockReturnValue(mockContextValue);

  return render(<PaymentForm groupId="group-1" {...props} />);
};

describe('PaymentForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (createPayment as jest.Mock).mockResolvedValue({
      // Mock successful creation
      id: 'payment-mock-id-123', // Use a predictable ID
      fromUser: 'user-1',
      toUser: 'user-2',
      amount: 50,
      date: new Date().toISOString(),
      groupId: 'group-1',
    });
  });

  it('renders correctly', () => {
    renderPaymentForm();
    // Use getAllByText and check first element (card title)
    expect(screen.getAllByText('Record Payment')[0]).toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('shows validation errors on submit with empty fields', async () => {
    renderPaymentForm();
    fireEvent.click(screen.getByRole('button', { name: /Record Payment/i }));

    // Use waitFor to wait for errors to appear
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
      expect(screen.getByText('Please select who is receiving the payment')).toBeInTheDocument();
    });

    expect(createPayment).not.toHaveBeenCalled(); // Ensure service not called
    expect(mockSetPayments).not.toHaveBeenCalled(); // Ensure context not updated
  });

  it('submits form successfully with valid input', async () => {
    const { container } = renderPaymentForm();

    // Get selects directly without relying on roles
    const selects = container.querySelectorAll('select');
    const fromSelect = selects[0];
    const toSelect = selects[1];
    const amountInput = screen.getByPlaceholderText('0.00');

    // Fill form
    if (fromSelect) fireEvent.change(fromSelect, { target: { value: 'user-1' } });
    if (toSelect) fireEvent.change(toSelect, { target: { value: 'user-2' } });
    fireEvent.change(amountInput, { target: { value: '50' } });
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-04-22' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Record Payment/i }));

    // Wait for async operations and checks
    await waitFor(() => {
      // Check that createPayment was called
      expect(createPayment).toHaveBeenCalledTimes(1);
      expect(createPayment).toHaveBeenCalledWith({
        fromUser: 'user-1',
        toUser: 'user-2',
        amount: 50,
        date: expect.stringContaining('2025-04-22'), // Check for the date part
        groupId: 'group-1',
      });
    });

    await waitFor(() => {
      // Check that setPayments was called *after* successful creation
      expect(mockSetPayments).toHaveBeenCalledTimes(1);
      expect(mockSetPayments).toHaveBeenCalledWith(expect.any(Function)); // Check it was called with a function updater

      // Check that confirmation screen is displayed - look for success text instead of test ID
      expect(screen.getByText('Payment Recorded Successfully!')).toBeInTheDocument();
    });
  });

  it('dismisses payment confirmation and resets form', async () => {
    const { container } = renderPaymentForm();

    // Get selects directly without relying on roles
    const selects = container.querySelectorAll('select');
    const fromSelect = selects[0];
    const toSelect = selects[1];
    const amountInput = screen.getByPlaceholderText('0.00');

    // Fill form
    if (fromSelect) fireEvent.change(fromSelect, { target: { value: 'user-1' } });
    if (toSelect) fireEvent.change(toSelect, { target: { value: 'user-2' } });
    fireEvent.change(amountInput, { target: { value: '50' } });
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-04-22' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Record Payment/i }));

    // Wait for the confirmation to appear
    await waitFor(() => {
      expect(screen.getByText('Payment Recorded Successfully!')).toBeInTheDocument();
    });

    // Click dismiss button (Close button in the confirmation)
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));

    // Wait for the form to reset and confirmation to disappear
    await waitFor(() => {
      expect(screen.queryByText('Payment Recorded Successfully!')).not.toBeInTheDocument();

      // Check that amount field is reset to 0
      const resetAmountInput = screen.getByPlaceholderText('0.00');
      expect(resetAmountInput).toHaveValue(0);
    });
  });
});
