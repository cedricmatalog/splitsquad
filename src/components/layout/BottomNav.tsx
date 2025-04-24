'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, DollarSign, Menu } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

interface BottomNavProps {
  toggleMobileMenu: () => void;
}

export function BottomNav({ toggleMobileMenu }: BottomNavProps) {
  const pathname = usePathname();
  const { currentUser } = useAppContext();

  // Don't show bottom nav if not logged in
  if (!currentUser) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white z-10 h-16 px-2">
      <div className="flex justify-around h-full">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 max-w-24 ${
            pathname === '/dashboard' ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        <Link
          href="/groups"
          className={`flex flex-col items-center justify-center flex-1 max-w-24 ${
            pathname === '/groups' || pathname.startsWith('/groups/')
              ? 'text-primary'
              : 'text-gray-500'
          }`}
        >
          <Users size={20} />
          <span className="text-xs mt-1">Groups</span>
        </Link>
        <Link
          href="/expenses"
          className={`flex flex-col items-center justify-center flex-1 max-w-24 ${
            pathname === '/expenses' || pathname.startsWith('/expenses/')
              ? 'text-primary'
              : 'text-gray-500'
          }`}
        >
          <DollarSign size={20} />
          <span className="text-xs mt-1">Expenses</span>
        </Link>
        <button
          onClick={toggleMobileMenu}
          className="flex flex-col items-center justify-center flex-1 max-w-24 text-gray-500"
        >
          <Menu size={20} />
          <span className="text-xs mt-1">Menu</span>
        </button>
      </div>
    </div>
  );
}
