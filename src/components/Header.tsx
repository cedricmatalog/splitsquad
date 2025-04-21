// This file is no longer needed since the functionality has been moved to AppLayout.tsx
// It's kept as a placeholder to avoid breaking any imports until they can be updated.

'use client';

import Link from 'next/link';

export default function Header() {
  // This component is deprecated, use AppLayout instead
  return (
    <header className="hidden">
      <div className="container">
        <Link href="/">SplitSquad</Link>
      </div>
    </header>
  );
}
