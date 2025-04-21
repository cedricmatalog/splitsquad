import { render, screen } from '@testing-library/react';
import { GroupList } from '@/components/dashboard/GroupList';
import { Group } from '@/types';
import { ReactNode } from 'react';

// Define mock component before using it
function MockLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href}>{children}</a>;
}
MockLink.displayName = 'MockLink';

// Mock Next.js Link component
jest.mock('next/link', () => MockLink);

describe('GroupList', () => {
  const mockGroups: Group[] = [
    {
      id: 'group-1',
      name: 'Summer Trip',
      description: 'Vacation expenses',
      createdBy: 'user-1',
      date: '2023-06-15T12:00:00Z',
    },
    {
      id: 'group-2',
      name: 'Apartment',
      description: 'Shared apartment costs',
      createdBy: 'user-2',
      date: '2023-05-01T10:30:00Z',
    },
  ];

  it('renders the group list title', () => {
    render(<GroupList groups={mockGroups} />);

    expect(screen.getByText('Your Groups')).toBeInTheDocument();
  });

  it('displays all provided groups', () => {
    render(<GroupList groups={mockGroups} />);

    expect(screen.getByText('Summer Trip')).toBeInTheDocument();
    expect(screen.getByText('Vacation expenses')).toBeInTheDocument();
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getByText('Shared apartment costs')).toBeInTheDocument();
  });

  it('respects the limit prop when provided', () => {
    render(<GroupList groups={mockGroups} limit={1} />);

    expect(screen.getByText('Summer Trip')).toBeInTheDocument();
    expect(screen.queryByText('Apartment')).not.toBeInTheDocument();
  });

  it('displays the create new group card', () => {
    render(<GroupList groups={mockGroups} />);

    expect(screen.getByText('Create New Group')).toBeInTheDocument();
    expect(screen.getByText('Start tracking expenses with friends')).toBeInTheDocument();
  });
});
