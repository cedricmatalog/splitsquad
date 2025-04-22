import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GroupForm } from '@/components/groups/GroupForm';
import { User } from '@/types';
import { createGroup } from '@/services/groups'; // Import the service

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock the createGroup service
jest.mock('@/services/groups', () => ({
  createGroup: jest.fn(),
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
];
const mockOnSubmit = jest.fn();

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

// Mock window.alert before tests run
beforeAll(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterAll(() => {
  // Restore original alert implementation
  (window.alert as jest.Mock).mockRestore();
});

describe('GroupForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (createGroup as jest.Mock).mockResolvedValue({
      // Mock successful creation
      id: 'group-mock-id-456', // Use a predictable ID
      name: 'Test Group',
      description: 'This is a test group',
      createdBy: 'user-1', // Ensure this matches expected UUID format if needed
      date: new Date().toISOString(),
    });
  });

  it('renders correctly', () => {
    renderGroupForm();
    // Use placeholder text instead of labels
    expect(screen.getByPlaceholderText('Summer Trip, Apartment, etc.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brief description of the group')).toBeInTheDocument();
    expect(screen.getByText('Group Members')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Group/i })).toBeInTheDocument();
  });

  it('validates form before submitting', async () => {
    renderGroupForm();
    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

    await waitFor(() => {
      expect(screen.getByText('Group name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    expect(createGroup).not.toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderGroupForm();

    // Fill form using placeholder text
    fireEvent.change(screen.getByPlaceholderText('Summer Trip, Apartment, etc.'), {
      target: { value: 'Test Group' },
    });
    fireEvent.change(screen.getByPlaceholderText('Brief description of the group'), {
      target: { value: 'This is a test group' },
    });

    // Select another member (user-1 is selected by default)
    fireEvent.click(screen.getByTestId('user-checkbox-user-2'));

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

    // Wait for async operations
    await waitFor(() => {
      // Check createGroup was called
      expect(createGroup).toHaveBeenCalledTimes(1);
      expect(createGroup).toHaveBeenCalledWith({
        name: 'Test Group',
        description: 'This is a test group',
        createdBy: 'user-1',
        date: expect.any(String),
      });
    });

    await waitFor(() => {
      // Check if onSubmit was called with correct data (including the ID from the mock response)
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Group',
        description: 'This is a test group',
        members: ['user-1', 'user-2'],
        id: 'group-mock-id-456', // Ensure this ID matches the mock response
      });
    });
  });

  it('handles member selection correctly', () => {
    renderGroupForm();
    // user-1 should be selected by default
    expect(screen.getByTestId('user-checkbox-user-1')).toHaveClass('border-primary');
    expect(screen.getByTestId('user-checkbox-user-2')).not.toHaveClass('border-primary');

    // Click user-2 to select
    fireEvent.click(screen.getByTestId('user-checkbox-user-2'));
    expect(screen.getByTestId('user-checkbox-user-2')).toHaveClass('border-primary');

    // Click user-2 again to deselect
    fireEvent.click(screen.getByTestId('user-checkbox-user-2'));
    expect(screen.getByTestId('user-checkbox-user-2')).not.toHaveClass('border-primary');

    // Cannot deselect current user (user-1)
    fireEvent.click(screen.getByTestId('user-checkbox-user-1'));
    expect(screen.getByTestId('user-checkbox-user-1')).toHaveClass('border-primary');
  });

  it('calls alert on failed group creation', async () => {
    // Override the mock for this specific test to simulate failure
    (createGroup as jest.Mock).mockResolvedValue(null);

    renderGroupForm();

    // Fill form using placeholder text
    fireEvent.change(screen.getByPlaceholderText('Summer Trip, Apartment, etc.'), {
      target: { value: 'Fail Group' },
    });
    fireEvent.change(screen.getByPlaceholderText('Brief description of the group'), {
      target: { value: 'This should fail' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

    // Wait for async operations
    await waitFor(() => {
      expect(createGroup).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      // Check that alert was called (since createGroup returned null)
      expect(window.alert).toHaveBeenCalledWith('Failed to create group. Please try again.');
      // Ensure onSubmit was NOT called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
