'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

export function GroupNotFound() {
  return (
    <div className="container mx-auto py-8 max-w-6xl text-center">
      <h1 className="text-3xl font-bold mb-4">Group Not Found</h1>
      <p className="mb-6 text-gray-500">The group you&apos;re looking for doesn&apos;t exist.</p>
      <Button asChild>
        <Link href="/groups">Back to Groups</Link>
      </Button>
    </div>
  );
}
