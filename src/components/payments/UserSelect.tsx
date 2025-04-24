'use client';

import { User } from '@/types';

interface UserSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  users: User[];
  error?: string;
  placeholder: string;
}

export function UserSelect({ label, value, onChange, users, error, placeholder }: UserSelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 border rounded-md ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
    >
      <option value="">{placeholder}</option>
      {users.map(user => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
