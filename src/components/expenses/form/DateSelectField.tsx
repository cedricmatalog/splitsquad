'use client';

import { DatePicker } from '@/components/ui/date-picker';
import { AlertCircle } from 'lucide-react';

interface DateSelectFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
}

export function DateSelectField({
  value,
  onChange,
  error,
  placeholder = 'Select a date',
}: DateSelectFieldProps) {
  return (
    <div>
      <DatePicker value={value} onChange={onChange} placeholder={placeholder} />
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
