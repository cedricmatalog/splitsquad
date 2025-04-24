'use client';

import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { DatePicker } from '@/components/ui';
import { Search, X } from 'lucide-react';

// Sub-component for search and filters
interface ExpenseFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  resetFilters: () => void;
}

export function ExpenseFilters({
  searchTerm,
  setSearchTerm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <div className="relative w-full sm:w-64">
        <Search
          size={16}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <Input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <div className="w-full sm:w-36">
          <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
        </div>
        <span className="hidden sm:inline">to</span>
        <div className="w-full sm:w-36">
          <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
        </div>

        {(searchTerm || startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto sm:ml-0">
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
