import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseListComponent as ExpenseList } from '@/components/expenses/ExpenseList';
import { setupMocks } from '../../utils/test-utils';
import React from 'react';

// Mock the AppContext
jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    users: [
      { id: 'user-1', name: 'Alex Johnson', avatar: '/avatars/alex.jpg' },
      { id: 'user-2', name: 'Jamie Smith', avatar: '/avatars/jamie.jpg' },
    ],
    groups: [{ id: 'group-1', name: 'Roommates', createdBy: 'user-1' }],
    refreshData: jest.fn(),
  }),
}));

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon" />,
  Calendar: () => <span data-testid="calendar-icon" />,
  X: () => <span data-testid="x-icon" />,
  PlusCircle: () => <span data-testid="plus-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  ChevronLeft: () => <span data-testid="chevron-left" />,
  ChevronRight: () => <span data-testid="chevron-right" />,
  List: () => <span data-testid="list-icon" />,
}));

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

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Setup mocks
setupMocks();

describe('ExpenseList', () => {
  const mockExpenses = [
    {
      id: 'expense-1',
      groupId: 'group-1',
      description: 'Groceries',
      amount: 125.75,
      paidBy: 'user-1',
      date: '2023-07-12T14:20:00Z',
    },
    {
      id: 'expense-2',
      groupId: 'group-1',
      description: 'Dinner',
      amount: 85.5,
      paidBy: 'user-2',
      date: '2023-07-11T19:30:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders expense list correctly', () => {
    render(<ExpenseList expenses={mockExpenses} />);

    // Check if table headers are present
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Paid By')).toBeInTheDocument();
    expect(screen.getByText('Group')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check if expense data is displayed
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('$125.75')).toBeInTheDocument();
    expect(screen.getByText('$85.50')).toBeInTheDocument();
    expect(screen.getAllByText('Alex Johnson')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Jamie Smith')[0]).toBeInTheDocument();

    // Check for view buttons (now eye icons)
    const eyeIcons = screen.getAllByTestId('eye-icon');
    expect(eyeIcons.length).toBe(2);
  });

  it('filters expenses by search term', () => {
    render(<ExpenseList expenses={mockExpenses} />);

    // Enter a search term
    fireEvent.change(screen.getByPlaceholderText('Search expenses...'), {
      target: { value: 'Groceries' },
    });

    // Check that only matching expenses are displayed
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
  });

  it('can hide the group column', () => {
    render(<ExpenseList expenses={mockExpenses} showGroupColumn={false} />);

    // Group column header should not be present
    expect(screen.queryByText('Group')).not.toBeInTheDocument();
  });

  it('shows add expense button when groupId is provided', () => {
    render(<ExpenseList expenses={mockExpenses} groupId="group-1" />);

    // Add Expense button should be present - use getAllByText instead since text appears in multiple elements
    const addButtons = screen.getAllByText(/Add/i);
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('shows "No expenses found" message when there are no expenses', () => {
    render(<ExpenseList expenses={[]} />);

    // Should show empty state message (now split into multiple elements)
    expect(screen.getByText('No expenses found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('resets filters when reset button is clicked', () => {
    render(<ExpenseList expenses={mockExpenses} />);

    // Enter a search term
    fireEvent.change(screen.getByPlaceholderText('Search expenses...'), {
      target: { value: 'Groceries' },
    });

    // Check that only matching expenses are displayed
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();

    // Click reset button (only appears after search terms are entered)
    fireEvent.click(screen.getByText('Reset'));

    // All expenses should be visible again
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });
});
