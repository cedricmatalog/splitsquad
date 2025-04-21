import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupForm } from '@/components/groups/GroupForm';
import { User } from '@/types';
import { ReactNode } from 'react';

// Mock Next.js Link component
// Define this before using it in jest.mock()
function MockLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href}>{children}</a>;
}
MockLink.displayName = 'MockLink';

jest.mock('next/link', () => MockLink);

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form elements', () => {
    render(
      <GroupForm
        users={mockUsers}
        currentUserId="user-1"
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByPlaceholderText('Summer Trip, Apartment, etc.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brief description of the group')).toBeInTheDocument();
    expect(screen.getByText('Group Members')).toBeInTheDocument();
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('Jamie Smith')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Group' })).toBeInTheDocument();
  });

  it('allows user to fill out the form', () => {
    render(
      <GroupForm
        users={mockUsers}
        currentUserId="user-1"
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Summer Trip, Apartment, etc.'), {
      target: { value: 'Summer Trip' },
    });

    fireEvent.change(screen.getByPlaceholderText('Brief description of the group'), {
      target: { value: 'Vacation expenses' },
    });

    // Select a member
    fireEvent.click(screen.getByTestId('user-checkbox-user-1'));

    expect(screen.getByPlaceholderText('Summer Trip, Apartment, etc.')).toHaveValue('Summer Trip');
    expect(screen.getByPlaceholderText('Brief description of the group')).toHaveValue(
      'Vacation expenses'
    );
  });

  it('calls onSubmit with form data when form is submitted', () => {
    render(
      <GroupForm
        users={mockUsers}
        currentUserId="user-1"
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Summer Trip, Apartment, etc.'), {
      target: { value: 'Summer Trip' },
    });

    fireEvent.change(screen.getByPlaceholderText('Brief description of the group'), {
      target: { value: 'Vacation expenses' },
    });

    // Select a member
    fireEvent.click(screen.getByTestId('user-checkbox-user-1'));

    fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Summer Trip',
      description: 'Vacation expenses',
      members: ['user-1'],
    });
  });

  it('displays validation error when submitted without required fields', () => {
    render(
      <GroupForm
        users={mockUsers}
        currentUserId="user-1"
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));

    expect(screen.getByText('Group name is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(
      <GroupForm
        users={mockUsers}
        currentUserId="user-1"
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Submit the form without filling in any fields
    fireEvent.click(screen.getByText('Create Group'));

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText('Group name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    // Ensure the onSubmit callback was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    render(
      <GroupForm
        users={mockUsers}
        currentUserId="user-1"
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Summer Trip, Apartment, etc.'), {
      target: { value: 'Test Group' },
    });

    fireEvent.change(screen.getByPlaceholderText('Brief description of the group'), {
      target: { value: 'Test Description' },
    });

    // Click on the second user to add them to the group
    const jamieCard = screen
      .getByText('Jamie Smith')
      .closest('div[class*="flex items-center gap-3"]');
    fireEvent.click(jamieCard!);

    // Submit the form
    fireEvent.click(screen.getByText('Create Group'));

    // Verify the onSubmit was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Group',
        description: 'Test Description',
        members: ['user-1', 'user-2'],
      });
    });
  });

  it('shows loading state when isSubmitting is true', () => {
    render(
      <GroupForm
        users={mockUsers}
        currentUserId="user-1"
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByText('Creating...')).toBeDisabled();
  });
});
