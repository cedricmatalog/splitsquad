'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

interface EmptyPaymentStateProps {
  groupId?: string;
}

export function EmptyPaymentState({ groupId }: EmptyPaymentStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
        <DollarSign className="h-6 w-6 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No payments recorded yet</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
        When group members record payments to each other, they will appear here.
      </p>
      {groupId && (
        <Button asChild>
          <Link href={`/groups/${groupId}/payments/new`}>Record a Payment</Link>
        </Button>
      )}
    </div>
  );
}
