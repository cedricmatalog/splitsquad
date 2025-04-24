'use client';

import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function AmountInput({ value, onChange, error }: AmountInputProps) {
  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
        <Input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className={`pl-7 ${error ? 'border-red-500' : ''}`}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
