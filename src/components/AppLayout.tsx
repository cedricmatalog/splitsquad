'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItemProps {
  href: string;
  children: ReactNode;
  isActive: boolean;
}

function NavItem({ href, children, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-2 rounded-md transition-colors ${
        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { currentUser } = useAppContext();

  // Skip layout on landing page
  if (pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold">
              SplitSquad
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavItem href="/dashboard" isActive={pathname === '/dashboard'}>
                Dashboard
              </NavItem>
              <NavItem
                href="/groups"
                isActive={pathname === '/groups' || pathname.startsWith('/groups/')}
              >
                Groups
              </NavItem>
              <NavItem
                href="/expenses"
                isActive={pathname === '/expenses' || pathname.startsWith('/expenses/')}
              >
                Expenses
              </NavItem>
            </nav>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium hidden sm:inline-block">{currentUser.name}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 bg-gray-50">{children}</main>

      <footer className="border-t py-6 bg-white">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            SplitSquad © {new Date().getFullYear()} - Share expenses easily
          </p>
        </div>
      </footer>
    </div>
  );
}
