'use client';

// No longer using these components directly
// import { TableHeader, TableRow, TableHead } from '@/components/ui/display';

// Sub-component for table header
interface ExpenseTableHeaderProps {
  showGroupColumn: boolean;
}

export function ExpenseTableHeader({ showGroupColumn }: ExpenseTableHeaderProps) {
  // Define column widths that match the rows
  const colWidths = {
    desc: '30%',
    amount: '15%',
    paidBy: '20%',
    group: '15%',
    date: '15%',
    actions: '120px',
  };

  return (
    <thead className="[&_tr]:border-b">
      <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors table w-full table-fixed">
        <th className="p-2 text-left align-middle font-medium" style={{ width: colWidths.desc }}>
          Description
        </th>
        <th className="p-2 text-left align-middle font-medium" style={{ width: colWidths.amount }}>
          Amount
        </th>
        <th className="p-2 text-left align-middle font-medium" style={{ width: colWidths.paidBy }}>
          Paid By
        </th>
        {showGroupColumn && (
          <th
            className="p-2 text-left align-middle font-medium hidden md:table-cell"
            style={{ width: colWidths.group }}
          >
            Group
          </th>
        )}
        <th
          className="p-2 text-right align-middle font-medium hidden sm:table-cell"
          style={{ width: colWidths.date }}
        >
          Date
        </th>
        <th
          className="p-2 text-center align-middle font-medium"
          style={{ width: colWidths.actions }}
        >
          Actions
        </th>
      </tr>
    </thead>
  );
}
