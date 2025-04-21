'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { BalanceOverview } from '@/components/balances/BalanceOverview';
import { useAppContext } from '@/context/AppContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPaymentPage() {
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
    <div className="container mx-auto py-8 max-w-3xl">
      <PageHeader
        title="Record Payment"
        description={`Record a payment for ${currentGroup?.name || 'your group'}`}
        backUrl={`/groups/${groupId}`}
      />

      <div className="grid grid-cols-1 gap-6 mt-6">
        {/* Current balance overview */}
        <BalanceOverview groupId={groupId} showPaymentButton={false} />
        
        {/* Payment form */}
        <PaymentForm groupId={groupId} />
      </div>
    </div>
  );
} 