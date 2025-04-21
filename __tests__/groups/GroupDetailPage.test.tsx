import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupDetails from '@/app/groups/[id]/page';

// Mock the use function for params
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    use: jest.fn((value) => value.id || 'group-1')
  };
});

describe('GroupDetails Page', () => {
  it('renders the group details', () => {
    render(<GroupDetails params={Promise.resolve({ id: 'group-1' })} />);
    
    // Check if group name and description are displayed
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    
    // Check if tabs are displayed
    expect(screen.getByRole('tab', { name: /Expenses/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Balances/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Settlements/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Members/i })).toBeInTheDocument();
  });

  it('renders group information cards', () => {
    render(<GroupDetails params={Promise.resolve({ id: 'group-1' })} />);
    
    // Check if group info cards are displayed
    expect(screen.getByText('Created By')).toBeInTheDocument();
    expect(screen.getByText('Date Created')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
  });

  it('shows group sharing dialog when share button is clicked', async () => {
    render(<GroupDetails params={Promise.resolve({ id: 'group-1' })} />);
    
    // Click the share button
    const shareButton = screen.getByText('Share Group');
    await userEvent.click(shareButton);
    
    // Check if share dialog is shown
    expect(screen.getByText('Share this group with friends to split expenses together')).toBeInTheDocument();
    expect(screen.getByText('Share Link')).toBeInTheDocument();
    expect(screen.getByText('Invite via Email')).toBeInTheDocument();
  });

  it('renders members tab when clicked', async () => {
    render(<GroupDetails params={Promise.resolve({ id: 'group-1' })} />);
    
    // Click the members tab
    const membersTab = screen.getByRole('tab', { name: /Members/i });
    await userEvent.click(membersTab);
    
    // Check if member list is displayed
    expect(screen.getByText('Group Members')).toBeInTheDocument();
    expect(screen.getByText('People participating in this group')).toBeInTheDocument();
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('Jamie Smith')).toBeInTheDocument();
  });

  it('handles join and leave group actions', async () => {
    // Temporarily mock the currentUser to be user-3 (not a member)
    const originalContext = jest.requireActual('@/context/AppContext');
    jest.spyOn(originalContext, 'useAppContext').mockImplementation(() => ({
      ...originalContext.useAppContext(),
      currentUser: { id: 'user-3', name: 'Taylor Brown', email: 'taylor@example.com' },
      groupMembers: [{ userId: 'user-1', groupId: 'group-1' }, { userId: 'user-2', groupId: 'group-1' }]
    }));
    
    render(<GroupDetails params={Promise.resolve({ id: 'group-1' })} />);
    
    // Check if Join Group button is displayed for non-members
    const joinButton = screen.getByText('Join Group');
    expect(joinButton).toBeInTheDocument();
    
    // Click join button
    await userEvent.click(joinButton);
    
    // Check if setGroupMembers was called
    const { setGroupMembers } = require('@/context/AppContext').useAppContext();
    expect(setGroupMembers).toHaveBeenCalled();
  });
}); 