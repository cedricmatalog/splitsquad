import Header from '@/components/Header';
import { ReactNode } from 'react';

export default function GroupsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
} 