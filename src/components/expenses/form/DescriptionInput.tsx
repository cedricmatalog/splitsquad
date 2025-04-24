'use client';

import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DescriptionInput({ value, onChange, error }: DescriptionInputProps) {
  return (
    <div>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Dinner, Groceries, Rent, etc."
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
