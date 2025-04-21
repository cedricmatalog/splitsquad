'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const router = useRouter();
  const { currentUser, logout } = useAppContext();

  // Skip layout on landing page
  if (pathname === '/') {
    return <>{children}</>;
  }

  // Skip layout on login and signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                <path d="M12 17V7"></path>
              </svg>
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
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar>
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem disabled>{currentUser.name}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
