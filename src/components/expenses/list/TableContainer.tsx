'use client';

import { ReactNode, useEffect } from 'react';
// Removing unused import
// import { Table } from '@/components/ui/display';

interface TableContainerProps {
  children: ReactNode;
  maxHeight?: string;
  onScroll?: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  paginationKey?: string | number;
}

export function TableContainer({
  children,
  maxHeight = '500px',
  onScroll,
  scrollContainerRef,
  paginationKey,
}: TableContainerProps) {
  // Reset scroll position when pagination key changes
  useEffect(() => {
    if (scrollContainerRef?.current && paginationKey !== undefined) {
      console.log('Resetting scroll position due to pagination key change:', paginationKey);
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [paginationKey, scrollContainerRef]);

  return (
    <div className="mt-4 border rounded-md overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="overflow-auto"
        style={{
          maxHeight: maxHeight,
          scrollbarWidth: 'thin',
        }}
        onScroll={onScroll}
        key={paginationKey}
      >
        <table className="w-full caption-bottom text-sm" style={{ tableLayout: 'fixed' }}>
          {children}
        </table>
      </div>
    </div>
  );
}
