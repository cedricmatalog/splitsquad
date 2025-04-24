'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface DashboardStatsProps {
  userBalance: number;
  totalGroups: number;
}

export function DashboardStats({ userBalance, totalGroups }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 truncate">Your Balance</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center">
          <div
            className={`text-3xl font-bold truncate ${userBalance > 0 ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : ''}`}
          >
            ${Math.abs(userBalance).toFixed(2)}
          </div>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {userBalance > 0 ? 'You are owed' : userBalance < 0 ? 'You owe' : 'All settled up'}
          </p>
        </CardContent>
      </Card>

      <Card className="flex flex-col h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 truncate">Total Groups</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center">
          <div className="text-3xl font-bold truncate">{totalGroups}</div>
          <p className="text-sm text-gray-500 mt-1 truncate">Active expense groups</p>
        </CardContent>
      </Card>

      <Card className="flex flex-col h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 truncate">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 flex-grow flex flex-col justify-center">
          <Button className="w-full text-sm" size="sm" asChild>
            <Link href="/expenses/new" className="truncate">
              Add Expense
            </Link>
          </Button>
          <Button className="w-full text-sm" variant="outline" size="sm" asChild>
            <Link href="/groups/new" className="truncate">
              Create Group
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="flex flex-col h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 truncate">Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center">
          <p className="text-sm text-gray-500 truncate">Recent transactions will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
}
