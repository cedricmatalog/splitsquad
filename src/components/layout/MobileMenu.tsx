'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LayoutDashboard, Users, DollarSign, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export function MobileMenu({ isOpen, onClose, onSignOut }: MobileMenuProps) {
  const pathname = usePathname();
  const { currentUser } = useAppContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in duration-200">
      <div className="bg-white h-full w-4/5 max-w-xs p-4 flex flex-col animate-in slide-in-from-left duration-300">
        <div className="flex justify-between items-center mb-8">
          <span className="text-xl font-bold">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X size={24} />
          </Button>
        </div>

        {currentUser && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{currentUser.name}</div>
                <div className="text-sm text-gray-500">{currentUser.email}</div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-md ${
              pathname === '/dashboard'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={onClose}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/groups"
            className={`flex items-center gap-3 px-4 py-3 rounded-md ${
              pathname === '/groups' || pathname.startsWith('/groups/')
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={onClose}
          >
            <Users size={20} />
            <span>Groups</span>
          </Link>
          <Link
            href="/expenses"
            className={`flex items-center gap-3 px-4 py-3 rounded-md ${
              pathname === '/expenses' || pathname.startsWith('/expenses/')
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={onClose}
          >
            <DollarSign size={20} />
            <span>Expenses</span>
          </Link>
        </nav>

        {currentUser && (
          <>
            <div className="mt-auto">
              <div className="border-t my-4"></div>

              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={onClose}
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="flex items-center w-full gap-3 px-4 py-3 rounded-md text-red-600 hover:bg-red-50"
              >
                <LogOut size={20} />
                <span>Sign out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
