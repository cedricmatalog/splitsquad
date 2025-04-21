'use client';

import { useAppContext } from '@/context/AppContext';

export function DashboardHeader() {
  const { currentUser } = useAppContext();

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome, {currentUser?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-gray-600 mt-1 max-w-lg">
            Track your expenses, settle debts, and manage your shared costs in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-xs text-gray-500">
            Last sync: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
