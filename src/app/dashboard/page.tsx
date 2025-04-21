'use client';

import { useAppContext } from '@/context/AppContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { GroupList } from '@/components/dashboard/GroupList';
import { UserBalanceCard } from '@/components/dashboard/UserBalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { groups, isAuthenticated, isLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <UserBalanceCard />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{groups.length}</div>
            <p className="text-sm text-gray-500 mt-1">Active expense groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" size="sm" asChild>
              <Link href="/expenses/new">Add Expense</Link>
            </Button>
            <Button className="w-full" variant="outline" size="sm" asChild>
              <Link href="/groups/new">Create Group</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Recent transactions will appear here</p>
          </CardContent>
        </Card>
      </div>

      <GroupList groups={groups} limit={4} />
    </div>
  );
}
