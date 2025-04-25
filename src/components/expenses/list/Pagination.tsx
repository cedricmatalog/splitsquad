'use client';

import { Button } from '@/components/ui/forms';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  // Debug when component re-renders
  useEffect(() => {
    console.log(`Pagination rendered: Page ${page} of ${totalPages}, items: ${totalItems}`);
  }, [page, pageSize, totalItems, totalPages]);

  const handlePreviousPage = () => {
    if (page > 1) {
      console.log('Going to previous page:', page - 1);
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      console.log('Going to next page:', page + 1);
      onPageChange(page + 1);
    }
  };

  // Go to specific page - currently unused but might be needed for future pagination improvements
  // const goToPage = (pageNumber: number) => {
  //   if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== page) {
  //     console.log('Going directly to page:', pageNumber);
  //     onPageChange(pageNumber);
  //   }
  // };

  return (
    <div className="flex items-center justify-between mt-4 border-t pt-4 border-gray-200">
      <div className="text-sm text-gray-500">
        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalItems)} of{' '}
        {totalItems} expenses
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
