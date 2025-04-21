import { render, screen } from '@testing-library/react';
import { AppLayout } from '@/components/AppLayout';
import { ReactNode } from 'react';
import * as navigation from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    currentUser: {
      id: 'user-1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      avatar: '/avatars/alex.png',
    },
    users: [
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
    ],
    logout: jest.fn(),
    setCurrentUser: jest.fn(),
  }),
}));

// Mock Next.js Link component - define it before using in jest.mock
function MockLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href}>{children}</a>;
}
MockLink.displayName = 'MockLink';

jest.mock('next/link', () => MockLink);

describe('AppLayout', () => {
  it('renders the layout with header, main content and footer', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    expect(screen.getByText('SplitSquad')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText(/SplitSquad © \d{4}/)).toBeInTheDocument();
  });

  it('renders the navigation items', () => {
    // PathName is mocked to return '/dashboard'
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const groupsLink = screen.getByText('Groups').closest('a');
    const expensesLink = screen.getByText('Expenses').closest('a');

    expect(dashboardLink).toBeInTheDocument();
    expect(groupsLink).toBeInTheDocument();
    expect(expensesLink).toBeInTheDocument();

    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(groupsLink).toHaveAttribute('href', '/groups');
    expect(expensesLink).toHaveAttribute('href', '/expenses');
  });
});

// Test with path set to root page (landing page)
describe('AppLayout with root path', () => {
  beforeEach(() => {
    jest.spyOn(navigation, 'usePathname').mockImplementation(() => '/');
  });

  it('skips the layout on the landing page', () => {
    render(
      <AppLayout>
        <div data-testid="landing-content">Landing Page</div>
      </AppLayout>
    );

    expect(screen.getByTestId('landing-content')).toBeInTheDocument();
    expect(screen.queryByText('SplitSquad')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
