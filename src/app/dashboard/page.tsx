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
import { PlusCircle, Users, Clock } from 'lucide-react';

export default function Dashboard() {
  const { groups, expenses, isAuthenticated, isLoading } = useAppContext();
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
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <UserBalanceCard />

        <Card className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gray-50 border-b">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Total Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{groups.length}</div>
            <p className="text-sm text-gray-500 mt-1">Active expense groups</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gray-50 border-b">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <PlusCircle size={16} className="text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <Button className="w-full" size="sm" asChild>
              <Link href="/expenses/new" className="gap-2">
                <PlusCircle size={14} />
                Add Expense
              </Link>
            </Button>
            <Button className="w-full" variant="outline" size="sm" asChild>
              <Link href="/groups/new" className="gap-2">
                <Users size={14} />
                Create Group
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gray-50 border-b">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {expenses && expenses.length > 0 ? (
              <div className="text-3xl font-bold">{expenses.length}</div>
            ) : (
              <p className="text-sm text-gray-500">No recent activities</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Groups</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/groups" className="text-primary hover:text-primary/90">
            View all
          </Link>
        </Button>
      </div>
      <GroupList groups={groups} limit={4} />
    </div>
  );
}
