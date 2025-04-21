import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { setupMocks } from '../../utils/test-utils';

// Mock the DatePicker component to avoid testing issues
jest.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ value, onChange, placeholder }: { 
    value: Date | undefined; 
    onChange: (date: Date) => void; 
    placeholder?: string 
  }) => (
    <div data-testid="date-picker">
      <input 
        type="date" 
        value={value instanceof Date ? value.toISOString().split('T')[0] : ''} 
        onChange={(e) => onChange(new Date(e.target.value))}
        placeholder={placeholder} 
      />
    </div>
  )
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
    date: '2023-07-12T14:20:00Z'
  };

  const mockExpenseParticipants = [
    { expenseId: 'expense-1', userId: 'user-1', share: 50 },
    { expenseId: 'expense-1', userId: 'user-2', share: 50 }
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
    expect(screen.getByPlaceholderText('0.00')).toHaveValue('100');
    
    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Update Expense')).toBeInTheDocument();
  });

  it('allows user to fill out the form', () => {
    render(<ExpenseForm groupId="group-1" />);
    
    // Fill out form
    fireEvent.change(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.'), {
      target: { value: 'Test Expense' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '75.50' }
    });
    
    // Select a payer
    const payerSelect = screen.getByText('Select who paid').closest('select');
    if (payerSelect) {
      fireEvent.change(payerSelect, { target: { value: 'user-1' } });
    }
    
    // Check values
    expect(screen.getByPlaceholderText('Dinner, Groceries, Rent, etc.')).toHaveValue('Test Expense');
    expect(screen.getByPlaceholderText('0.00')).toHaveValue('75.50');
  });

  it('shows validation errors when submitting with missing fields', () => {
    render(<ExpenseForm />);
    
    // Submit without filling required fields
    fireEvent.click(screen.getByText('Create Expense'));
    
    // Check for validation errors
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    expect(screen.getByText('Please select a group')).toBeInTheDocument();
    expect(screen.getByText('Please select who paid')).toBeInTheDocument();
  });

  it('allows switching between equal and custom split types', () => {
    render(<ExpenseForm groupId="group-1" />);
    
    // Fill amount to see shares
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' }
    });
    
    // Select split type dropdown
    const splitTypeSelect = screen.getByText('Equal Split').closest('select');
    if (splitTypeSelect) {
      fireEvent.change(splitTypeSelect, { target: { value: 'custom' } });
    }
    
    // Now we should be able to edit individual shares
    const shareInputs = screen.getAllByDisplayValue('50');
    expect(shareInputs[0]).not.toBeDisabled();
    
    // Change a share value
    fireEvent.change(shareInputs[0], { target: { value: '75' } });
    fireEvent.change(shareInputs[1], { target: { value: '25' } });
    
    // Check shares add up to the total
    expect(screen.getAllByDisplayValue('75')).toHaveLength(1);
    expect(screen.getAllByDisplayValue('25')).toHaveLength(1);
  });
}); 