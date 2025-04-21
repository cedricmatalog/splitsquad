'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { PaymentHistory } from '@/components/payments/PaymentHistory';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, DollarSign } from 'lucide-react';

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
    <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 max-w-6xl">
      <PageHeader
        title="Payment History"
        description="All your payments across all groups"
        action={
          groups.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {groups.slice(0, 2).map(group => (
                <Button key={group.id} variant="outline" size="sm" asChild>
                  <Link
                    href={`/groups/${group.id}/payments/new`}
                    className="flex items-center gap-1.5 text-nowrap"
                  >
                    <DollarSign size={14} />
                    <span className="hidden sm:inline">Pay in</span> {group.name.split(' ')[0]}
                  </Link>
                </Button>
              ))}

              {groups.length > 2 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/groups" className="flex items-center gap-1.5">
                    <span>View All</span>
                  </Link>
                </Button>
              )}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6">
        {/* User-specific payments */}
        <PaymentHistory userId={currentUser.id} />

        {groups.length === 0 ? (
          <Card className="border hover:shadow-md transition-all duration-200">
            <CardContent className="py-8">
              <div className="text-center">
                <div className="mb-4 w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Groups Yet</h3>
                <p className="text-gray-500 mb-4">
                  Join or create a group to start tracking expenses and payments.
                </p>
                <Button asChild className="gap-2">
                  <Link href="/groups/new">
                    <PlusCircle size={16} />
                    Create a Group
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Mobile floating action button */}
      {groups.length > 0 && (
        <div className="fixed right-4 bottom-20 md:hidden">
          <Button size="lg" className="h-14 w-14 rounded-full shadow-lg" asChild>
            <Link href={`/groups/${groups[0].id}/payments/new`} aria-label="Make a payment">
              <DollarSign size={24} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
