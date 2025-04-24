'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface NavItemProps {
  href: string;
  children: ReactNode;
  isActive: boolean;
  icon?: ReactNode;
}

export function NavItem({ href, children, isActive, icon }: NavItemProps) {
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
