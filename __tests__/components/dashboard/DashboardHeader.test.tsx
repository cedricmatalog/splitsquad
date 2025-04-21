import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

describe('DashboardHeader', () => {
  it('renders the dashboard title', () => {
    render(<DashboardHeader />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Track your expenses and settle up with friends')).toBeInTheDocument();
  });
});
