import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { setupMocks } from '../../utils/test-utils';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { createExpense, updateExpense } from '@/services/expenses';
import {
  createExpenseParticipant,
  getExpenseParticipants,
  deleteExpenseParticipantByKeys,
} from '@/services/expense_participants';

// Mock expense services
jest.mock('@/services/expenses', () => ({
  createExpense: jest.fn(),
  updateExpense: jest.fn(),
}));

// Mock expense participant services
jest.mock('@/services/expense_participants', () => ({
  createExpenseParticipant: jest.fn(),
  getExpenseParticipants: jest.fn(),
  deleteExpenseParticipantByKeys: jest.fn(),
}));

// Mock useExpenseCalculations hook
jest.mock('@/hooks/useExpenseCalculations', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock useAppContext hook
jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock the DatePicker component
jest.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({
    value,
    onChange,
    placeholder,
  }: {
    value: Date | undefined;
    onChange: (date: Date) => void;
    placeholder?: string;
  }) => (
    <div data-testid="date-picker">
      <input
        type="date"
        value={value instanceof Date ? value.toISOString().split('T')[0] : ''}
        onChange={e => onChange(new Date(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  ),
}));

// Setup test mocks
setupMocks();

// Mock React's useEffect to prevent infinite loops in tests
const originalUseEffect = React.useEffect;
jest.spyOn(React, 'useEffect').mockImplementation(function mockUseEffect(fn, deps) {
  // If the dependencies include shares.length, modify it to avoid infinite loops
  if (deps && Array.isArray(deps) && deps.includes('shares.length')) {
    // Remove problematic dependency - in the actual code this is shares.length
    // but we're using a simple string to match without needing the component state
    return originalUseEffect(
      fn,
      deps.filter(dep => dep !== 'shares.length')
    );
  }
  return originalUseEffect(fn, deps);
});

// Mock window.alert
const mockAlert = jest.fn();
window.alert = mockAlert;

// Mock data
const mockUsers = [
  {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: '/avatars/alex.png',
  },
  {
    id: 'user-2',
    name: 'Jamie Smith',
    email: 'jamie@example.com',
    avatar: '/avatars/jamie.png',
  },
];

const mockGroups = [
  { id: 'group-1', name: 'Trip to Paris', createdBy: 'user-1' },
  { id: 'group-2', name: 'Apartment', createdBy: 'user-2' },
];

const mockGroupMembers = [
  { userId: 'user-1', groupId: 'group-1' },
  { userId: 'user-2', groupId: 'group-1' },
  { userId: 'user-1', groupId: 'group-2' },
];

const mockExpense = {
  id: 'expense-1',
  groupId: 'group-1',
  description: 'Dinner',
  amount: 100,
  paidBy: 'user-1',
  date: '2023-07-12T14:20:00Z',
};

const mockExpenseParticipants = [
  { expenseId: 'expense-1', userId: 'user-1', share: 50 },
  { expenseId: 'expense-1', userId: 'user-2', share: 50 },
];

describe('ExpenseForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful expense operations
    (createExpense as jest.Mock).mockResolvedValue({
      ...mockExpense,
      id: 'new-expense-1',
    });

    (updateExpense as jest.Mock).mockResolvedValue({
      ...mockExpense,
      description: 'Updated Dinner',
    });

    (getExpenseParticipants as jest.Mock).mockResolvedValue(mockExpenseParticipants);

    (createExpenseParticipant as jest.Mock).mockImplementation(participant =>
      Promise.resolve({
        ...participant,
        createdAt: new Date().toISOString(),
      })
    );

    (deleteExpenseParticipantByKeys as jest.Mock).mockResolvedValue(true);

    // Mock useExpenseCalculations implementation
    (useExpenseCalculations as jest.Mock).mockReturnValue({
      getGroupMembers: jest.fn(() => {
        // Return all users as group members for simplicity
        return mockUsers;
      }),
      getExpenseParticipants: jest.fn(() => mockExpenseParticipants),
    });

    // Mock useAppContext implementation
    (useAppContext as jest.Mock).mockReturnValue({
      users: mockUsers,
      groups: mockGroups,
      setExpenses: jest.fn(),
      setExpenseParticipants: jest.fn(),
      currentUser: mockUsers[0],
      groupMembers: mockGroupMembers,
    });
  });

  afterAll(() => {
    // Restore original React hooks
    jest.restoreAllMocks();
  });

  it('renders new expense form correctly', () => {
    render(<ExpenseForm groupId="group-1" />);

    expect(screen.getByText('New Expense')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByText('Group')).toBeInTheDocument();
    expect(screen.getByText('Paid by')).toBeInTheDocument();
    expect(screen.getByText('Split Type')).toBeInTheDocument();
  });

  it('renders edit expense form correctly', () => {
    render(
      <ExpenseForm
        expense={mockExpense}
        expenseParticipants={mockExpenseParticipants}
        isEditing={true}
      />
    );

    expect(screen.getByText('Edit Expense')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.')).toHaveValue('Dinner');

    const amountInput = screen.getByPlaceholderText('0.00');
    expect(amountInput).toHaveValue(100);

    expect(screen.getByText('Update Expense')).toBeInTheDocument();
  });

  it('allows user to fill out the form', async () => {
    render(<ExpenseForm groupId="group-1" />);

    // Fill out form
    fireEvent.change(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.'), {
      target: { value: 'Test Expense' },
    });

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '75.50' },
    });

    // Select a payer
    const payerSelect = screen.getAllByRole('combobox')[1]; // Second select is the payer
    fireEvent.change(payerSelect, { target: { value: 'user-1' } });

    // Check values
    expect(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.')).toHaveValue(
      'Test Expense'
    );
    expect(screen.getByPlaceholderText('0.00')).toHaveValue(75.5);
  });

  it('shows validation errors when submitting with missing fields', () => {
    render(<ExpenseForm />);

    // Submit without filling required fields
    fireEvent.click(screen.getByText('Create Expense'));

    // Check for validation errors
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    expect(screen.getByText('Please select a group')).toBeInTheDocument();
  });

  it('allows switching between equal and custom split types', async () => {
    render(<ExpenseForm groupId="group-1" />);

    // Set an amount
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });

    // Change split type
    const splitTypeSelect = screen.getAllByRole('combobox')[2]; // Third select is split type
    fireEvent.change(splitTypeSelect, { target: { value: 'custom' } });

    // After switching to custom, inputs should be enabled
    const shareInputs = screen.getAllByRole('spinbutton');
    // First input is the amount input, so we need to check the others
    for (let i = 1; i < shareInputs.length; i++) {
      expect(shareInputs[i]).not.toBeDisabled();
    }
  });

  it('successfully submits new expense with valid data', async () => {
    const mockSetExpenses = jest.fn();
    const mockSetExpenseParticipants = jest.fn();

    (useAppContext as jest.Mock).mockReturnValue({
      users: mockUsers,
      groups: mockGroups,
      setExpenses: mockSetExpenses,
      setExpenseParticipants: mockSetExpenseParticipants,
      currentUser: mockUsers[0],
      groupMembers: mockGroupMembers,
    });

    render(<ExpenseForm groupId="group-1" />);

    // Fill out form with valid data
    fireEvent.change(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.'), {
      target: { value: 'Test Expense' },
    });

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '75.50' },
    });

    // Select a payer
    const payerSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(payerSelect, { target: { value: 'user-1' } });

    // Submit the form
    fireEvent.click(screen.getByText('Create Expense'));

    // Wait for the form submission
    await waitFor(() => {
      expect(createExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Test Expense',
          amount: 75.5,
          groupId: 'group-1',
          paidBy: 'user-1',
        })
      );
    });

    // Verify participants were created
    await waitFor(() => {
      expect(createExpenseParticipant).toHaveBeenCalled();
    });

    // Verify context was updated
    await waitFor(() => {
      expect(mockSetExpenses).toHaveBeenCalled();
      expect(mockSetExpenseParticipants).toHaveBeenCalled();
    });
  });

  it('successfully updates an existing expense', async () => {
    const mockSetExpenses = jest.fn();
    const mockSetExpenseParticipants = jest.fn();

    (useAppContext as jest.Mock).mockReturnValue({
      users: mockUsers,
      groups: mockGroups,
      setExpenses: mockSetExpenses,
      setExpenseParticipants: mockSetExpenseParticipants,
      currentUser: mockUsers[0],
      groupMembers: mockGroupMembers,
    });

    render(
      <ExpenseForm
        expense={mockExpense}
        expenseParticipants={mockExpenseParticipants}
        isEditing={true}
      />
    );

    // Update the description
    fireEvent.change(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.'), {
      target: { value: 'Updated Dinner' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Update Expense'));

    // Wait for the form submission
    await waitFor(() => {
      expect(updateExpense).toHaveBeenCalledWith(
        mockExpense.id,
        expect.objectContaining({
          description: 'Updated Dinner',
        })
      );
    });

    // Verify participants were updated
    await waitFor(() => {
      expect(getExpenseParticipants).toHaveBeenCalled();
      expect(deleteExpenseParticipantByKeys).toHaveBeenCalled();
      expect(createExpenseParticipant).toHaveBeenCalled();
    });

    // Verify context was updated
    await waitFor(() => {
      expect(mockSetExpenses).toHaveBeenCalled();
      expect(mockSetExpenseParticipants).toHaveBeenCalled();
    });
  });

  it('shows alert when expense creation fails', async () => {
    // Mock a failed expense creation
    (createExpense as jest.Mock).mockResolvedValue(null);

    // Mock console.error
    const originalConsoleError = console.error;
    const mockConsoleError = jest.fn();
    console.error = mockConsoleError;

    // Mock useAppContext implementation
    (useAppContext as jest.Mock).mockReturnValue({
      users: mockUsers,
      groups: mockGroups,
      setExpenses: jest.fn(),
      setExpenseParticipants: jest.fn(),
      currentUser: mockUsers[0],
      groupMembers: mockGroupMembers,
    });

    render(<ExpenseForm groupId="group-1" />);

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.'), {
      target: { value: 'Test Expense' },
    });

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '75.50' },
    });

    // Select required fields
    const groupSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(groupSelect, { target: { value: 'group-1' } });

    const payerSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(payerSelect, { target: { value: 'user-1' } });

    // Submit the form
    fireEvent.click(screen.getByText('Create Expense'));

    // Wait for console.error to be called
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalled();
    });

    // Verify the error message
    expect(mockConsoleError.mock.calls[0][0]).toBe('Error saving expense:');
    expect(mockConsoleError.mock.calls[0][1].message).toBe('Failed to save expense');

    // Restore console.error
    console.error = originalConsoleError;
  });
});
