'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser } = useAppContext();

  const [isClient, setIsClient] = useState(false);

  // Only run after client-side hydration is complete
  useEffect(() => {
    setIsClient(true);
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
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
            <span className="font-bold text-xl">SplitSquad</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium hover:text-primary ${isActive('/dashboard') ? 'text-primary' : 'text-gray-500'
                }`}
            >
              Dashboard
            </Link>
            <Link
              href="/groups"
              className={`text-sm font-medium hover:text-primary ${isActive('/groups') ? 'text-primary' : 'text-gray-500'
                }`}
            >
              Groups
            </Link>
            <Link
              href="/expenses"
              className={`text-sm font-medium hover:text-primary ${isActive('/expenses') ? 'text-primary' : 'text-gray-500'
                }`}
            >
              Expenses
            </Link>
            <Link
              href="/settings"
              className={`text-sm font-medium hover:text-primary ${isActive('/settings') ? 'text-primary' : 'text-gray-500'
                }`}
            >
              Settings
            </Link>
          </nav>
        </div>

        {isClient && currentUser && (
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href="/expenses/new">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Add Expense
              </Link>
            </Button>

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
                <DropdownMenuLabel>Switch User (Demo)</DropdownMenuLabel>
                {users.map((user) => (
                  <DropdownMenuItem key={user.id} onClick={() => switchUser(user.id)}>
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {user.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">Sign out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
} 