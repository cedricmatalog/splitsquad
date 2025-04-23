'use client';

import { useAppContext } from '@/context/AppContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { GroupList } from '@/components/dashboard/GroupList';
import { UserBalanceCard } from '@/components/dashboard/UserBalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Users, Clock, ArrowRight } from 'lucide-react';
import useAuthRedirect from '@/hooks/useAuthRedirect';

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
  const { groups, expenses, isLoading, currentUser, groupMembers } = useAppContext();
  const { isReady } = useAuthRedirect();

  // Filter groups to only show those the user is a member of or created
  const userGroups = currentUser
    ? groups.filter(
        group =>
          // User created the group
          group.createdBy === currentUser.id ||
          // User is a member of the group
          groupMembers.some(
            member => member.userId === currentUser.id && member.groupId === group.id
          )
      )
    : [];

  // Filter expenses to only show those from the user's groups
  const userExpenses = currentUser
    ? expenses.filter(expense => {
        // Check if the expense belongs to a group the user is a member of
        return groupMembers.some(
          member => member.userId === currentUser.id && member.groupId === expense.groupId
        );
      })
    : [];

  // If loading, show loading state
  if (isLoading || !isReady) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center animate-gentle-slide">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show skeleton if data is still loading but user is authenticated
  if (!groups || !expenses) {
    return (
      <div className="container mx-auto pt-4 pb-8 px-4 sm:px-6 sm:pt-6 max-w-6xl">
        <div className="h-12 w-48 skeleton rounded-md mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 skeleton rounded-lg"></div>
          ))}
        </div>
        <div className="h-8 w-32 skeleton rounded-md mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-60 skeleton rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-4 pb-8 px-4 sm:px-6 sm:pt-6 max-w-6xl animate-soft-fade">
      <DashboardHeader />

      {/* Main stats cards - stacked on mobile, grid on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
        <UserBalanceCard />

        <Card
          className="border border-gray-200 shadow-sm card-hover-effect rounded-lg overflow-hidden animate-subtle-scale"
          style={{ animationDelay: '100ms' }}
        >
          <CardHeader className="pb-3 pt-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users size={16} className="text-primary flex-shrink-0" />
              <span className="truncate">My Groups</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex-grow flex flex-col justify-center">
            <div className="text-3xl font-bold truncate">{userGroups.length}</div>
            <p className="text-sm text-gray-500 mt-1 truncate">Active expense groups</p>
          </CardContent>
        </Card>

        {/* Quick actions card - full width on mobile for easy tapping */}
        <Card
          className="border border-gray-200 shadow-sm card-hover-effect sm:col-span-2 lg:col-span-1 flex flex-col rounded-lg overflow-hidden animate-subtle-scale"
          style={{ animationDelay: '200ms' }}
        >
          <CardHeader className="pb-3 pt-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <PlusCircle size={16} className="text-primary flex-shrink-0" />
              <span className="truncate">Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-2">
              <Link href="/expenses/new" className="flex-1">
                <Button className="w-full gradient-primary hover:opacity-90 text-white focus-ring transition">
                  <div className="flex items-center justify-center gap-2">
                    <PlusCircle size={16} />
                    <span>Add Expense</span>
                  </div>
                </Button>
              </Link>
              <Link href="/groups/new" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 focus-ring transition"
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
        <Card
          className="border border-gray-200 shadow-sm card-hover-effect flex flex-col rounded-lg overflow-hidden animate-subtle-scale"
          style={{ animationDelay: '300ms' }}
        >
          <CardHeader className="pb-3 pt-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock size={16} className="text-primary flex-shrink-0" />
              <span className="truncate">Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 flex-grow flex flex-col justify-center">
            {userExpenses && userExpenses.length > 0 ? (
              <div className="text-3xl font-bold truncate">{userExpenses.length}</div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500 truncate">No recent activities</p>
                <Link
                  href="/expenses/new"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Add your first expense
                </Link>
              </div>
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
          className="text-primary hover:text-primary/80 focus-ring transition-colors"
          asChild
        >
          <Link href="/groups" className="flex items-center gap-1">
            <span className="truncate">View all</span>
            <ArrowRight size={14} className="flex-shrink-0" />
          </Link>
        </Button>
      </div>

      {/* Add scroll indicator for mobile */}
      <div className="md:hidden mb-4 text-xs text-gray-500 flex items-center justify-center gap-2 animate-soft-fade">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-1"></div>
        <span className="truncate">Scroll horizontally to see more</span>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-1"></div>
      </div>

      {/* Display empty state if no groups */}
      {userGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center animate-gentle-slide">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users size={24} className="text-primary" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No groups yet</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Create a group to start splitting expenses with friends, roommates, or travel companions
          </p>
          <Button asChild className="gradient-primary hover:opacity-90">
            <Link href="/groups/new">Create your first group</Link>
          </Button>
        </div>
      ) : (
        <GroupList groups={userGroups} limit={4} />
      )}

      {/* Mobile floating action button for quick expense creation */}
      <div className="fixed right-4 bottom-20 md:hidden animate-soft-fade">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg gradient-primary hover:opacity-90 card-hover-effect focus-ring"
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
