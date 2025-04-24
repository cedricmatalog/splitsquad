'use client';

import { DollarSign } from 'lucide-react';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export function AmountInput({ value, onChange }: AmountInputProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <DollarSign className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="number"
        placeholder="0.00"
        step="0.01"
        value={value === 0 ? '' : value}
        onChange={e => {
          const inputValue = e.target.value;
          // If empty, set to 0
          if (inputValue === '') {
            onChange(0);
          } else {
            // Otherwise parse as float
            onChange(parseFloat(inputValue));
          }
        }}
        className="w-full pl-10 px-3 py-2 border rounded-md border-gray-300"
        aria-label="Payment amount"
      />
    </div>
  );
}
