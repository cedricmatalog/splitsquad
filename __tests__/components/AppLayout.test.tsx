import { render, screen, within } from '@testing-library/react';
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

// Mock Lucide Icons
jest.mock('lucide-react', () => ({
  Menu: () => <span data-testid="menu-icon" />,
  X: () => <span data-testid="close-icon" />,
  LayoutDashboard: () => <span data-testid="dashboard-icon" />,
  Users: () => <span data-testid="users-icon" />,
  DollarSign: () => <span data-testid="dollar-icon" />,
  ChevronRight: () => <span data-testid="chevron-icon" />,
}));

describe('AppLayout', () => {
  it('renders the layout with header, main content and footer', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    expect(screen.getByText('SplitSquad')).toBeInTheDocument();
    // Test presence of navigation items
    const navItems = screen.getAllByText('Dashboard');
    expect(navItems.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Groups').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Expenses').length).toBeGreaterThan(0);
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders the navigation items', () => {
    // PathName is mocked to return '/dashboard'
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    // Find navigation items by role with name to be more specific
    const desktopNav = screen.getAllByRole('navigation')[0]; // Get the first navigation element
    const dashboardLink = within(desktopNav).getByText('Dashboard').closest('a');
    const groupsLink = within(desktopNav).getByText('Groups').closest('a');
    const expensesLink = within(desktopNav).getByText('Expenses').closest('a');

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
