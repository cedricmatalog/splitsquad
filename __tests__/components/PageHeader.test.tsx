import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/PageHeader';
import { ReactNode } from 'react';

// Define a named component for the mock
function MockLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href}>{children}</a>;
}
MockLink.displayName = 'MockLink';

// Mock Next.js Link component
jest.mock('next/link', () => MockLink);

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<PageHeader title="Test Title" description="Test description" />);

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Groups', href: '/groups' },
      { label: 'New Group' },
    ];

    render(<PageHeader title="Test Title" breadcrumbs={breadcrumbs} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('New Group')).toBeInTheDocument();
  });

  it('renders the correct number of separators in breadcrumbs', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Groups', href: '/groups' },
      { label: 'New Group' },
    ];

    render(<PageHeader title="Test Title" breadcrumbs={breadcrumbs} />);

    // There should be 2 separators for 3 breadcrumb items
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(2);
  });

  it('does not render breadcrumbs when not provided', () => {
    render(<PageHeader title="Test Title" />);

    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('renders links for breadcrumb items with href', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Groups', href: '/groups' },
      { label: 'New Group' },
    ];

    render(<PageHeader title="Test Title" breadcrumbs={breadcrumbs} />);

    const homeLink = screen.getByText('Home').closest('a');
    const groupsLink = screen.getByText('Groups').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(groupsLink).toHaveAttribute('href', '/groups');
  });
});
