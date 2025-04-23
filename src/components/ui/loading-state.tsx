'use client';

import { Spinner } from '@/components/ui/spinner';

export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
