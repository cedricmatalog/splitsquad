'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { PaymentHistory } from '@/components/payments/PaymentHistory';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentsPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { groups, isAuthenticated } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Find the current group
  const currentGroup = groups.find(group => group.id === groupId);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="Payment History"
          description={`All payments for ${currentGroup?.name || 'this group'}`}
          backUrl={`/groups/${groupId}`}
        />
        <Button asChild>
          <Link href={`/groups/${groupId}/payments/new`}>Record New Payment</Link>
        </Button>
      </div>

      <PaymentHistory groupId={groupId} />
    </div>
  );
} 