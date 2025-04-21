import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupDetails from '@/app/groups/[id]/page';

// Mock the use function for params
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    use: jest.fn().mockImplementation((promise) => {
      if (promise && typeof promise === 'object' && 'id' in promise) {
        return promise.id;
      }
      return 'non-existent-group';
    })
  };
});

describe('GroupDetails Page', () => {
  it('renders not found state when group is not found', () => {
    render(<GroupDetails params={Promise.resolve({ id: 'non-existent-group' })} />);
    
    // Check if "not found" message is displayed
    expect(screen.getByText('Group Not Found')).toBeInTheDocument();
    expect(screen.getByText("The group you're looking for doesn't exist.")).toBeInTheDocument();
    expect(screen.getByText('Back to Groups')).toBeInTheDocument();
  });
}); 