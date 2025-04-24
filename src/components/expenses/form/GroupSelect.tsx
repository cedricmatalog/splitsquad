'use client';

import { Group } from '@/types';
import { AlertCircle } from 'lucide-react';

interface GroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  groups: Group[];
  error?: string;
}

export function GroupSelect({ value, onChange, groups, error }: GroupSelectProps) {
  return (
    <div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : ''}`}
      >
        <option value="">Select a group</option>
        {groups.map(group => (
          <option key={group.id} value={group.id}>
            {group.name}
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
