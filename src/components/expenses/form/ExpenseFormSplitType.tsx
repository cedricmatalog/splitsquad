'use client';

interface ExpenseFormSplitTypeProps {
  splitType: string;
  onChange: (value: string) => void;
}

export function ExpenseFormSplitType({ splitType, onChange }: ExpenseFormSplitTypeProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Split Type</label>
      <div className="flex items-center space-x-4">
        <select
          value={splitType}
          onChange={e => onChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full"
        >
          <option value="equal">Equal Split</option>
          <option value="custom">Custom Amounts</option>
          <option value="percentage" disabled>
            Percentage (Coming Soon)
          </option>
        </select>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {splitType === 'equal' && 'Split the expense equally among selected members'}
        {splitType === 'custom' && 'Specify exact amounts for each member'}
        {splitType === 'percentage' && 'Split by percentage (coming soon)'}
      </p>
    </div>
  );
}
