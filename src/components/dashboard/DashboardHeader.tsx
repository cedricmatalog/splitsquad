'use client';

import { useAppContext } from '@/context/AppContext';
import { format } from 'date-fns';

/**
 * Renders the header section for the dashboard.
 *
 * Displays a welcome message to the current user (fetched from AppContext)
 * and the current time.
 * Includes a brief description of the application's purpose.
 */
export function DashboardHeader() {
  const { currentUser } = useAppContext();
  const now = new Date();

  return (
    <div className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 shadow-sm border border-blue-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome, {currentUser?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 max-w-lg">
            Track your expenses, settle debts, and manage your shared costs in one place.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="text-xs flex items-center gap-1 bg-white/70 py-1 px-2 rounded-full shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Updated: {format(now, 'h:mm a')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
