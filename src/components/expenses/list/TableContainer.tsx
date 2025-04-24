'use client';

import { ReactNode } from 'react';
import { Table } from '@/components/ui';

interface TableContainerProps {
  children: ReactNode;
  maxHeight?: string;
  onScroll?: () => void;
}

export function TableContainer({ children, maxHeight = '500px', onScroll }: TableContainerProps) {
  return (
    <div className="mt-4 border rounded-md overflow-hidden">
      <div
        className="overflow-auto"
        style={{
          maxHeight: maxHeight,
          scrollbarWidth: 'thin',
        }}
        onScroll={onScroll}
      >
        <Table>{children}</Table>
      </div>
    </div>
  );
}
