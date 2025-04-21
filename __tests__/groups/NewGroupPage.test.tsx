import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewGroup from '@/app/groups/new/page';

// Mock router used within the component
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  }),
}));

describe('NewGroup Page', () => {
  it('renders the form elements', () => {
    render(<NewGroup />);
    
    // Check if title exists
    expect(screen.getByText('Create New Group')).toBeInTheDocument();
    
    // Check if form inputs exist
    expect(screen.getByLabelText(/Group Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByText(/Group Members/i)).toBeInTheDocument();
    
    // Check if buttons exist
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Group/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<NewGroup />);
    
    // Get the create button and click it
    const createButton = screen.getByRole('button', { name: /Create Group/i });
    await userEvent.click(createButton);
    
    // Check if validation errors are shown
    expect(screen.getByText('Group name is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('toggles member selection when clicked', async () => {
    render(<NewGroup />);
    
    // Find a member that can be toggled (not the current user)
    const memberCard = screen.getByText('Jamie Smith').closest('div');
    
    // Initial state should not have the primary border
    expect(memberCard).not.toHaveClass('border-primary');
    
    // Click the member to toggle
    await userEvent.click(memberCard!);
    
    // Now it should have the primary border
    expect(memberCard).toHaveClass('border-primary');
    
    // Click again to toggle off
    await userEvent.click(memberCard!);
    
    // Should no longer have the primary border
    expect(memberCard).not.toHaveClass('border-primary');
  });

  it('fills out and submits the form successfully', async () => {
    const { useAppContext } = require('@/context/AppContext');
    const { useRouter } = require('next/navigation');
    
    render(<NewGroup />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/Group Name/i), 'Test Group Name');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Test Description');
    
    // Select a member
    const memberCard = screen.getByText('Jamie Smith').closest('div');
    await userEvent.click(memberCard!);
    
    // Submit the form
    const createButton = screen.getByRole('button', { name: /Create Group/i });
    await userEvent.click(createButton);
    
    // Check if the context function was called
    const { setGroups, setGroupMembers } = useAppContext();
    expect(setGroups).toHaveBeenCalled();
    expect(setGroupMembers).toHaveBeenCalled();
    
    // Check if router.push was called
    const router = useRouter();
    expect(router.push).toHaveBeenCalled();
  });
}); 