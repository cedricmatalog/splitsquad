import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GroupForm } from '@/components/groups/GroupForm';
import { User } from '@/types';
import { createGroup } from '@/services/groups';
import { createGroupMember } from '@/services/group_members';

// Mock the services
jest.mock('@/services/groups', () => ({
  createGroup: jest.fn(),
}));

jest.mock('@/services/group_members', () => ({
  createGroupMember: jest.fn(),
}));

// Mock data
const mockUsers: User[] = [
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
  {
    id: 'user-3',
    name: 'Taylor Wilson',
    email: 'taylor@example.com',
    avatar: '/taylor.png',
  },
];

describe('GroupForm', () => {
  // Mock window.alert
  const mockAlert = jest.fn();
  window.alert = mockAlert;

  // Mock onSubmit handler
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful group creation
    (createGroup as jest.Mock).mockResolvedValue({
      id: 'group-123',
      name: 'Test Group',
      description: 'A test group',
      created_at: new Date().toISOString(),
    });

    // Mock successful group member creation
    (createGroupMember as jest.Mock).mockResolvedValue({
      user_id: 'user-1',
      group_id: 'group-123',
      created_at: new Date().toISOString(),
    });
  });

  const renderGroupForm = (props = {}) => {
    return render(
      <GroupForm
        users={mockUsers}
        currentUserId="user-1"
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        {...props}
      />
    );
  };

  it('renders correctly', () => {
    renderGroupForm();
    expect(screen.getByText('Group Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Group Members')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Group/i })).toBeInTheDocument();
  });

  it('validates form before submitting', async () => {
    renderGroupForm();

    // Submit without filling out required fields
    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Group name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(createGroup).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderGroupForm();

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Summer Trip, Apartment, etc.'), {
      target: { value: 'Test Group' },
    });

    fireEvent.change(screen.getByPlaceholderText('Brief description of the group'), {
      target: { value: 'A test group' },
    });

    // Select members (current user is already selected by default)
    fireEvent.click(screen.getByTestId('user-checkbox-user-2')); // Select the second user

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

    // Wait for the form submission
    await waitFor(() => {
      expect(createGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Group',
          description: 'A test group',
        })
      );
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('allows selecting and deselecting group members', () => {
    renderGroupForm();

    // User checkboxes
    const user1Checkbox = screen.getByTestId('user-checkbox-user-1');
    const user2Checkbox = screen.getByTestId('user-checkbox-user-2');

    // Verify current user is selected and appears disabled
    expect(user1Checkbox).toHaveClass('opacity-70');

    // Select another user
    fireEvent.click(user2Checkbox);
    expect(user2Checkbox).toHaveClass('border-primary');

    // Deselect the user
    fireEvent.click(user2Checkbox);
    expect(user2Checkbox).not.toHaveClass('border-primary');
  });
});
