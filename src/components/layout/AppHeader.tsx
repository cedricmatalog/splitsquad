'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { LayoutDashboard, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavItem } from './NavItem';
import { useAppContext } from '@/context/AppContext';

interface AppHeaderProps {
  toggleMobileMenu: () => void;
}

export function AppHeader({ toggleMobileMenu }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout, isLoading } = useAppContext();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-10 h-16 force-gpu">
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-xl font-bold flex items-center gap-2 text-gray-900 hover:text-primary transition-colors animate-subtle-scale"
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItem
              href="/dashboard"
              isActive={pathname === '/dashboard'}
              icon={<LayoutDashboard size={16} />}
            >
              <span className="min-w-[70px]">Dashboard</span>
            </NavItem>
            <NavItem
              href="/groups"
              isActive={pathname === '/groups' || pathname.startsWith('/groups/')}
              icon={<Users size={16} />}
            >
              <span className="min-w-[50px]">Groups</span>
            </NavItem>
            <NavItem
              href="/expenses"
              isActive={pathname === '/expenses' || pathname.startsWith('/expenses/')}
              icon={<DollarSign size={16} />}
            >
              <span className="min-w-[60px]">Expenses</span>
            </NavItem>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile menu button - show only on screens smaller than medium, but keep hidden on very small screens where we'll use bottom nav */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden md:hidden"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </Button>

          {isLoading ? (
            // Show a loading placeholder when auth state is loading
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
          ) : currentUser ? (
            // Show user dropdown when authenticated
            <div className="flex items-center">
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
          ) : (
            // Show login button when not authenticated
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Log In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
