import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

describe('DashboardHeader', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: '/avatars/alex.png',
  };

  it('renders the dashboard title', () => {
    render(<DashboardHeader currentUser={null} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage your expenses and groups')).toBeInTheDocument();
  });

  it('displays user information when a user is provided', () => {
    render(<DashboardHeader currentUser={mockUser} />);

    expect(screen.getByText('Signed in as')).toBeInTheDocument();
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
  });

  it('does not display user information when no user is provided', () => {
    render(<DashboardHeader currentUser={null} />);

    expect(screen.queryByText('Signed in as')).not.toBeInTheDocument();
  });
});
