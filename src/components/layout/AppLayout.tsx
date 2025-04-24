'use client';

import { ReactNode, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { AppHeader } from './AppHeader';
import { MobileMenu } from './MobileMenu';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Skip layout on landing page
  if (pathname === '/') {
    return <>{children}</>;
  }

  // Skip layout on login and signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col content-shift-free">
      {/* App Header */}
      <AppHeader toggleMobileMenu={toggleMobileMenu} />

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={toggleMobileMenu} onSignOut={handleSignOut} />

      {/* Content */}
      <main className="flex-1 pt-6 pb-24 md:pb-10 container mx-auto px-4">{children}</main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav toggleMobileMenu={toggleMobileMenu} />
    </div>
  );
}
