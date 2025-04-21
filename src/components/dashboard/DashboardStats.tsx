'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStatsProps {
  userBalance: number;
  totalGroups: number;
}

export function DashboardStats({ userBalance, totalGroups }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${userBalance > 0 ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : ''}`}
          >
            ${Math.abs(userBalance).toFixed(2)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {userBalance > 0 ? 'You are owed' : userBalance < 0 ? 'You owe' : 'All settled up'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalGroups}</div>
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
  );
}
