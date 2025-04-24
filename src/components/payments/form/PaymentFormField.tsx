'use client';

import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface PaymentFormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
}

export function PaymentFormField({ label, children, error }: PaymentFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
