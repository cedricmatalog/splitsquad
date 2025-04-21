import React from 'react';
import { render, screen } from '@testing-library/react';
import Groups from '@/app/groups/page';

describe('Groups Page', () => {
  it('renders the groups page title', () => {
    render(<Groups />);
    
    // Check if title exists
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Manage your expense groups')).toBeInTheDocument();
  });

  it('renders the create group button', () => {
    render(<Groups />);
    
    // Check if create button exists
    const createButton = screen.getByText('Create New Group');
    expect(createButton).toBeInTheDocument();
    expect(createButton.closest('a')).toHaveAttribute('href', '/groups/new');
  });

  it('renders the search input', () => {
    render(<Groups />);
    
    // Check if search input exists
    const searchInput = screen.getByPlaceholderText('Search groups...');
    expect(searchInput).toBeInTheDocument();
  });
}); 