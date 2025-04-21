import { render, screen } from '@testing-library/react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ReactNode } from 'react';

// Define mock component before using it
function MockLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href}>{children}</a>;
}
MockLink.displayName = 'MockLink';

// Mock Next.js Link component
jest.mock('next/link', () => MockLink);

describe('DashboardStats', () => {
  it('renders positive balance correctly', () => {
    render(<DashboardStats userBalance={25.5} totalGroups={3} />);

    expect(screen.getByText('$25.50')).toBeInTheDocument();
    expect(screen.getByText('You are owed')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Active expense groups')).toBeInTheDocument();
  });

  it('renders negative balance correctly', () => {
    render(<DashboardStats userBalance={-15.75} totalGroups={2} />);

    expect(screen.getByText('$15.75')).toBeInTheDocument();
    expect(screen.getByText('You owe')).toBeInTheDocument();
  });

  it('renders zero balance correctly', () => {
    render(<DashboardStats userBalance={0} totalGroups={0} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('All settled up')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<DashboardStats userBalance={0} totalGroups={0} />);

    expect(screen.getByText('Add Expense')).toBeInTheDocument();
    expect(screen.getByText('Create Group')).toBeInTheDocument();
  });
});
