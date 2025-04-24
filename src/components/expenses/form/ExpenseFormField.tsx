'use client';

import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ExpenseFormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  description?: string;
}

export function ExpenseFormField({ label, children, error, description }: ExpenseFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {description && <p className="text-xs text-gray-500">{description}</p>}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
