'use client';

import { ReactNode, useState } from 'react';
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
import { Menu, X, LayoutDashboard, Users, DollarSign, ChevronRight } from 'lucide-react';

interface NavItemProps {
  href: string;
  children: ReactNode;
  isActive: boolean;
  icon?: ReactNode;
}

function NavItem({ href, children, isActive, icon }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 font-medium w-[120px] justify-center ${
        isActive
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon && <span className="w-5 h-5 mr-2 flex items-center justify-center">{icon}</span>}
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col  content-shift-free">
      <header className="border-b bg-white shadow-sm sticky top-0 z-10 h-16 force-gpu">
        <div className="container mx-auto px-4 h-full flex justify-between items-center">
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
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </Button>

            {currentUser && (
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
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMobileMenu}
      ></div>

      <div
        className={`fixed top-0 right-0 h-full w-3/4 max-w-xs bg-white z-50 shadow-xl transform transition-optimized ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden force-gpu`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="rounded-full"
              aria-label="Close menu"
            >
              <X size={20} />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              <Link
                href="/dashboard"
                className={`flex items-center px-4 py-3 rounded-md transition-colors duration-200 ${
                  pathname === '/dashboard'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={toggleMobileMenu}
              >
                <span className="w-6 h-6 mr-3 flex items-center justify-center">
                  <LayoutDashboard size={20} />
                </span>
                <span className="flex-1">Dashboard</span>
                <ChevronRight size={16} className="ml-auto flex-shrink-0" />
              </Link>

              <Link
                href="/groups"
                className={`flex items-center px-4 py-3 rounded-md transition-colors duration-200 ${
                  pathname === '/groups' || pathname.startsWith('/groups/')
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={toggleMobileMenu}
              >
                <span className="w-6 h-6 mr-3 flex items-center justify-center">
                  <Users size={20} />
                </span>
                <span className="flex-1">Groups</span>
                <ChevronRight size={16} className="ml-auto flex-shrink-0" />
              </Link>

              <Link
                href="/expenses"
                className={`flex items-center px-4 py-3 rounded-md transition-colors duration-200 ${
                  pathname === '/expenses' || pathname.startsWith('/expenses/')
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={toggleMobileMenu}
              >
                <span className="w-6 h-6 mr-3 flex items-center justify-center">
                  <DollarSign size={20} />
                </span>
                <span className="flex-1">Expenses</span>
                <ChevronRight size={16} className="ml-auto flex-shrink-0" />
              </Link>
            </div>
          </nav>

          {currentUser && (
            <div className="border-t p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/settings" onClick={toggleMobileMenu}>
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    handleSignOut();
                    toggleMobileMenu();
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 pb-10">{children}</main>

      <footer className="border-t py-6 bg-white force-gpu">
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
