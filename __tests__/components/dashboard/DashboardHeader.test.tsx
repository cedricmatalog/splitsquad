import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

// Mock the useAppContext hook
jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(() => ({
    currentUser: { name: 'Alex' },
  })),
}));

describe('DashboardHeader', () => {
  it('renders the welcome message and description', () => {
    render(<DashboardHeader />);

    // Check for the welcome message with the user's name
    expect(screen.getByText('Welcome, Alex')).toBeInTheDocument();
    // Check for the updated description text
    expect(
      screen.getByText(
        'Track your expenses, settle debts, and manage your shared costs in one place.'
      )
    ).toBeInTheDocument();
    // Check for the last sync text
    expect(screen.getByText(/Last sync:/)).toBeInTheDocument();
  });
});
