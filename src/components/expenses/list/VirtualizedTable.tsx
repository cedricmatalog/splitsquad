'use client';

import { TableBody } from '@/components/ui/table';
import React, { ReactNode } from 'react';
import { Expense } from '@/types';

interface VirtualizedTableProps {
  tableBodyRef: React.RefObject<HTMLTableSectionElement | null>;
  displayExpenses: Expense[];
  virtualItems: { index: number; offsetTop: number; height: number }[];
  totalHeight: number;
  renderTableRow: (expense: Expense, style?: React.CSSProperties) => ReactNode;
  emptyStateRow: ReactNode;
}

export function VirtualizedTable({
  tableBodyRef,
  displayExpenses,
  virtualItems,
  totalHeight,
  renderTableRow,
  emptyStateRow,
}: VirtualizedTableProps) {
  return (
    <TableBody
      ref={tableBodyRef}
      className="relative block h-auto"
      style={{
        height: totalHeight > 0 ? totalHeight : 'auto',
        minHeight: displayExpenses.length === 0 ? '100px' : undefined,
      }}
    >
      {displayExpenses.length === 0 ? (
        emptyStateRow
      ) : (
        <>
          {virtualItems.map(virtualItem => {
            const expense = displayExpenses[virtualItem.index];
            return (
              <React.Fragment key={expense.id}>
                {renderTableRow(expense, {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.offsetTop}px)`,
                })}
              </React.Fragment>
            );
          })}
        </>
      )}
    </TableBody>
  );
}
