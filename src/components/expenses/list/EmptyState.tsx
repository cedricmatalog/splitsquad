'use client';

import { Calendar } from 'lucide-react';

// Sub-component for empty state
interface EmptyStateProps {
  showGroupColumn: boolean;
}

export function EmptyState({ showGroupColumn }: EmptyStateProps) {
  return (
    <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
      <td
        colSpan={showGroupColumn ? 6 : 5}
        className="p-2 align-middle whitespace-nowrap text-center text-gray-500 h-24"
      >
        <div className="flex flex-col items-center py-4">
          <Calendar className="h-10 w-10 text-gray-300 mb-2" />
          <p>No expenses found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      </td>
    </tr>
  );
}
