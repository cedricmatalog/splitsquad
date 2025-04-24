'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { PaymentForm } from '@/components/payments';
import { BalanceOverview } from '@/components/balances/BalanceOverview';
import { useAppContext } from '@/context/AppContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPaymentPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const { groups, isAuthenticated, currentUser, groupMembers } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if the current user is a member of this group
    if (currentUser && groupId) {
      const isUserMember = groupMembers.some(
        member => member.userId === currentUser.id && member.groupId === groupId
      );

      // Check if the user created the group
      const isUserCreator = groups.some(
        group => group.id === groupId && group.createdBy === currentUser.id
      );

      // If neither a member nor the creator, redirect to groups page
      if (!isUserMember && !isUserCreator) {
        console.warn("User tried to access payment page for a group they don't belong to");
        router.push('/groups');
      }
    }
  }, [isAuthenticated, router, currentUser, groupId, groupMembers, groups]);

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
