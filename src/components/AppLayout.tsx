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
      className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
        isActive
          ? 'bg-primary/10 text-primary font-medium shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-xl font-bold flex items-center gap-2 text-gray-900 hover:text-primary transition-colors"
            >
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
              <span>SplitSquad</span>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
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
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-primary/5 hover:ring-primary/20 transition-all"
                  >
                    <Avatar>
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {currentUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem disabled className="opacity-70">
                    {currentUser.name}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="opacity-70 text-xs">
                    {currentUser.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pb-10">{children}</main>

      <footer className="border-t py-6 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              SplitSquad © {new Date().getFullYear()} - Share expenses easily
            </p>
            <div className="flex gap-4 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-700 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-700 transition-colors">
                Terms
              </Link>
              <Link href="/help" className="text-gray-500 hover:text-gray-700 transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
