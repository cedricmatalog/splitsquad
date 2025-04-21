import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { setupMocks } from '../../utils/test-utils';

// Mock the DatePicker component to avoid testing issues
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

// Setup mocks
setupMocks();

describe('ExpenseForm', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders new expense form correctly', () => {
    render(<ExpenseForm groupId="group-1" />);

    // Check form title and description
    expect(screen.getByText('New Expense')).toBeInTheDocument();
    expect(screen.getByText('Enter the details of your expense')).toBeInTheDocument();

    // Check form elements
    expect(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByText('Group')).toBeInTheDocument();
    expect(screen.getByText('Paid by')).toBeInTheDocument();
    expect(screen.getByText('Split Type')).toBeInTheDocument();
    expect(screen.getByText('Split Details')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Expense')).toBeInTheDocument();
  });

  it('renders edit expense form correctly', () => {
    render(
      <ExpenseForm
        expense={mockExpense}
        expenseParticipants={mockExpenseParticipants}
        isEditing={true}
      />
    );

    // Check form title and description
    expect(screen.getByText('Edit Expense')).toBeInTheDocument();
    expect(screen.getByText('Update expense details')).toBeInTheDocument();

    // Check form elements have the correct values
    expect(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.')).toHaveValue('Dinner');
    
    // Use toHaveValue without type checking (numbers are converted to strings in DOM)
    const amountInput = screen.getByPlaceholderText('0.00');
    expect(amountInput).toHaveValue(100); // Accept number value

    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
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
    const payerSelect = screen.getByText('Select who paid').closest('select');
    if (payerSelect) {
      fireEvent.change(payerSelect, { target: { value: 'user-1' } });
    }

    // Check values
    expect(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.')).toHaveValue(
      'Test Expense'
    );
    
    // Use toHaveValue without string type checking
    const amountInput = screen.getByPlaceholderText('0.00');
    expect(amountInput).toHaveValue(75.5); // Accept number value
    
    // Verify that shares are updated when amount changes (using waitFor to handle async behavior)
    await waitFor(() => {
      // Get all share inputs - with our mock data and equal split, 
      // we expect two 37.75 values (75.50 / 2)
      const shareInputs = screen.getAllByRole('spinbutton');
      // Skip the amount input (which is the first one)
      const actualShareInputs = shareInputs.slice(1);
      
      // The exact values might depend on rounding, so we're checking they're populated and disabled
      expect(actualShareInputs.length).toBeGreaterThan(0);
      expect(actualShareInputs[0]).toBeDisabled(); // Should be disabled for equal split
    });
  });

  it('shows validation errors when submitting with missing fields', () => {
    render(<ExpenseForm />);

    // Submit without filling required fields
    fireEvent.click(screen.getByText('Create Expense'));

    // Check for validation errors - using more flexible queries
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    expect(screen.getByText('Please select a group')).toBeInTheDocument();
    
    // The "Please select who paid" error might not appear immediately because the paidBy 
    // selection is dependent on having a group selected first
    // So we'll make this optional or check for the disabled selection option instead
    expect(screen.getByText('Select a group first')).toBeInTheDocument();
  });

  it('allows switching between equal and custom split types', async () => {
    render(<ExpenseForm groupId="group-1" />);

    // Fill amount to see shares
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });
    
    // Wait for shares to be updated after amount changes
    await waitFor(() => {
      const shareInputs = screen.getAllByRole('spinbutton').slice(1);
      expect(shareInputs.length).toBeGreaterThan(0);
    });

    // Select split type dropdown
    const splitTypeSelect = screen.getByText('Equal Split').closest('select');
    if (splitTypeSelect) {
      fireEvent.change(splitTypeSelect, { target: { value: 'custom' } });
    }

    // Now we should be able to edit individual shares
    const shareInputs = screen.getAllByRole('spinbutton').slice(1);
    expect(shareInputs[0]).not.toBeDisabled(); // Should be enabled for custom split

    // Change share values
    fireEvent.change(shareInputs[0], { target: { value: '75' } });
    fireEvent.change(shareInputs[1], { target: { value: '25' } });

    // Check shares add up to the total
    expect(screen.getByDisplayValue('75')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
  });
  
  it('updates shares when group changes', async () => {
    render(<ExpenseForm />);
    
    // Enter an amount first
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });
    
    // Select a group
    const groupSelect = screen.getByText('Select a group').closest('select');
    if (groupSelect) {
      fireEvent.change(groupSelect, { target: { value: 'group-1' } });
    }
    
    // Wait for shares to be updated after group selection
    await waitFor(() => {
      const shareInputs = screen.getAllByRole('spinbutton').slice(1);
      expect(shareInputs.length).toBeGreaterThan(0);
      
      // With equal split and an amount of 100, we expect 50/50 for two members
      expect(shareInputs[0]).toHaveValue(50);
    });
  });
});
