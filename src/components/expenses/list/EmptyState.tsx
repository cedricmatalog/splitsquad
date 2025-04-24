'use client';

import { TableRow, TableCell } from '@/components/ui/table';
import { Calendar } from 'lucide-react';

// Sub-component for empty state
interface EmptyStateProps {
  showGroupColumn: boolean;
}

export function EmptyState({ showGroupColumn }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={showGroupColumn ? 6 : 5} className="text-center text-gray-500 h-24">
        <div className="flex flex-col items-center py-4">
          <Calendar className="h-10 w-10 text-gray-300 mb-2" />
          <p>No expenses found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      </TableCell>
    </TableRow>
  );
}
