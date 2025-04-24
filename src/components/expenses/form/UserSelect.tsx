'use client';

import { User } from '@/types';
import { AlertCircle } from 'lucide-react';

interface UserSelectProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  error?: string;
  placeholder?: string;
  currentUserId?: string;
}

export function UserSelect({
  value,
  onChange,
  users,
  error,
  placeholder = 'Select a user',
  currentUserId,
}: UserSelectProps) {
  return (
    <div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : ''}`}
      >
        <option value="">{placeholder}</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name}
            {user.id === currentUserId ? ' (You)' : ''}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
