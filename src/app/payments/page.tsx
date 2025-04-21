'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { PaymentHistory } from '@/components/payments/PaymentHistory';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function PaymentsPage() {
  const { groups, currentUser, isAuthenticated } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <PageHeader
          title="Payment History"
          description="All your payments across all groups"
        />
        <div className="flex gap-2">
          {groups.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {groups.slice(0, 3).map(group => (
                <Button key={group.id} variant="outline" size="sm" asChild>
                  <Link href={`/groups/${group.id}/payments/new`}>
                    Pay in {group.name}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* User-specific payments */}
        <PaymentHistory userId={currentUser.id} />
        
        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No Groups Yet</h3>
                <p className="text-gray-500 mb-4">
                  Join or create a group to start tracking expenses and payments.
                </p>
                <Button asChild>
                  <Link href="/groups/new">Create a Group</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
} 