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
import { PlusCircle, Users, Clock, ArrowRight } from 'lucide-react';

/**
 * Renders the main dashboard page.
 *
 * Fetches data from the AppContext and displays:
 * - A header with user information.
 * - Key statistics cards (User Balance, Total Groups, Quick Actions, Recent Activity).
 * - A list of the user's groups with horizontal scrolling on mobile.
 * - A floating action button for adding expenses on mobile.
 *
 * Handles loading states and redirects unauthenticated users to the login page.
 */
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
    <div className="container mx-auto pt-4 pb-8 px-4 sm:px-6 sm:pt-6 max-w-6xl">
      <DashboardHeader />

      {/* Main stats cards - stacked on mobile, grid on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
        <UserBalanceCard />

        <Card className="border border-gray-200 shadow-sm transform transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col rounded-lg overflow-hidden">
          <CardHeader className="pb-3 pt-3 bg-gray-50 border-b">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users size={16} className="text-blue-600 flex-shrink-0" />
              <span className="truncate">Total Groups</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex-grow flex flex-col justify-center">
            <div className="text-3xl font-bold truncate">{groups.length}</div>
            <p className="text-sm text-gray-500 mt-1 truncate">Active expense groups</p>
          </CardContent>
        </Card>

        {/* Quick actions card - full width on mobile for easy tapping */}
        <Card className="border border-gray-200 shadow-sm transform transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 sm:col-span-2 lg:col-span-1 flex flex-col rounded-lg overflow-hidden">
          <CardHeader className="pb-3 pt-3 bg-gray-50 border-b">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <PlusCircle size={16} className="text-blue-600 flex-shrink-0" />
              <span className="truncate">Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-2">
              <Link href="/expenses/new" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition">
                  <div className="flex items-center justify-center gap-2">
                    <PlusCircle size={16} />
                    <span>Add Expense</span>
                  </div>
                </Button>
              </Link>
              <Link href="/groups/new" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users size={16} />
                    <span>Create Group</span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity card - display on top on mobile */}
        <Card className="border border-gray-200 shadow-sm transform transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col rounded-lg overflow-hidden">
          <CardHeader className="pb-3 pt-3 bg-gray-50 border-b">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock size={16} className="text-blue-600 flex-shrink-0" />
              <span className="truncate">Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex-grow flex flex-col justify-center">
            {expenses && expenses.length > 0 ? (
              <div className="text-3xl font-bold truncate">{expenses.length}</div>
            ) : (
              <p className="text-sm text-gray-500 truncate">No recent activities</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile-friendly group section with swipe indicator */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold truncate">Your Groups</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition"
          asChild
        >
          <Link href="/groups" className="flex items-center gap-1">
            <span className="truncate">View all</span>
            <ArrowRight size={14} className="flex-shrink-0" />
          </Link>
        </Button>
      </div>

      {/* Add scroll indicator for mobile */}
      <div className="md:hidden mb-4 text-xs text-gray-500 flex items-center justify-center gap-2">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-1"></div>
        <span className="truncate">Scroll horizontally to see more</span>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-1"></div>
      </div>

      {/* Adjust GroupList component to handle horizontal scrolling on mobile */}
      <GroupList groups={groups} limit={4} />

      {/* Mobile floating action button for quick expense creation */}
      <div className="fixed right-4 bottom-20 md:hidden">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transform transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
          asChild
        >
          <Link href="/expenses/new" aria-label="Add new expense">
            <PlusCircle size={24} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
