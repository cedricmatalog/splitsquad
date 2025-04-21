import { render, screen, fireEvent } from '@testing-library/react';
import { GroupForm } from '@/components/groups/GroupForm';
import { User } from '@/types';
import { setupMocks } from '../../utils/test-utils';

// Setup mock environment
setupMocks();

describe('GroupForm', () => {
  const mockUsers: User[] = [
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

  const mockOnSubmit = jest.fn();

  // Provide all required props for GroupForm
  const defaultProps = {
    users: mockUsers,
    currentUserId: 'user-1',
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form elements correctly', () => {
    render(<GroupForm {...defaultProps} />);

    expect(screen.getByPlaceholderText('Summer Trip, Apartment, etc.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brief description of the group')).toBeInTheDocument();
    expect(screen.getByText('Group Members')).toBeInTheDocument();
    expect(screen.getByText('Select who will be part of this group')).toBeInTheDocument();

    // Check if both users are displayed
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('Jamie Smith')).toBeInTheDocument();

    // Check if the buttons are rendered
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Group')).toBeInTheDocument();
  });

  it('allows user input', () => {
    render(<GroupForm {...defaultProps} />);

    // Input group name
    const nameInput = screen.getByPlaceholderText('Summer Trip, Apartment, etc.');
    fireEvent.change(nameInput, { target: { value: 'Test Group' } });
    expect(nameInput).toHaveValue('Test Group');

    // Input description
    const descriptionInput = screen.getByPlaceholderText('Brief description of the group');
    fireEvent.change(descriptionInput, { target: { value: 'This is a test group' } });
    expect(descriptionInput).toHaveValue('This is a test group');
  });

  it('allows member selection', () => {
    render(<GroupForm {...defaultProps} />);

    // Current user (user-1) should be selected by default and cannot be deselected
    const user1Checkbox = screen.getByTestId('user-checkbox-user-1');
    expect(user1Checkbox.className).toContain('bg-primary/10');

    // Select user 2
    const user2Checkbox = screen.getByTestId('user-checkbox-user-2');
    fireEvent.click(user2Checkbox);

    // User 2 should now be selected
    expect(user2Checkbox.className).toContain('bg-primary/10');
  });

  it('submits form with valid data', () => {
    render(<GroupForm {...defaultProps} />);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Summer Trip, Apartment, etc.'), {
      target: { value: 'Test Group' },
    });
    fireEvent.change(screen.getByPlaceholderText('Brief description of the group'), {
      target: { value: 'This is a test group' },
    });

    // Select user 2
    fireEvent.click(screen.getByTestId('user-checkbox-user-2'));

    // Submit form
    fireEvent.click(screen.getByText('Create Group'));

    // Check if onSubmit was called with correct data
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Test Group',
      description: 'This is a test group',
      members: ['user-1', 'user-2'],
    });
  });

  it('displays validation errors on invalid submission', () => {
    render(<GroupForm {...defaultProps} />);

    // Submit form without any data
    fireEvent.click(screen.getByText('Create Group'));

    // Validation errors should be displayed
    expect(screen.getByText('Group name is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    render(<GroupForm {...defaultProps} isSubmitting={true} />);

    // Check if button is in loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByText('Creating...')).toBeDisabled();
  });
});
