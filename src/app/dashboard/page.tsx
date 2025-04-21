'use client';

import { useAppContext } from '@/context/AppContext';
import useExpenseCalculations from '@/hooks/useExpenseCalculations';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { GroupList } from '@/components/dashboard/GroupList';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { groups, currentUser, isAuthenticated } = useAppContext();
  const { calculateUserTotalBalance } = useExpenseCalculations();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // If not authenticated, show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  const userBalance = calculateUserTotalBalance();

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <DashboardHeader currentUser={currentUser} />
      <DashboardStats userBalance={userBalance} totalGroups={groups.length} />
      <GroupList groups={groups} limit={4} />
    </div>
  );
}
