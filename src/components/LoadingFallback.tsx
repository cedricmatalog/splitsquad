import React from 'react';

interface LoadingFallbackProps {
  message?: string;
  height?: string;
  showSpinner?: boolean;
}

export function LoadingFallback({
  message = 'Loading...',
  height = '100vh',
  showSpinner = true,
}: LoadingFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full" style={{ height }}>
      {showSpinner && (
        <div className="mb-4 relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
        </div>
      )}
      {message && <p className="text-gray-500">{message}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="w-1/3 h-6 bg-gray-200 rounded"></div>
      <div className="w-full h-4 bg-gray-200 rounded"></div>
      <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="h-8 bg-gray-200 rounded col-span-1"></div>
          <div className="h-8 bg-gray-200 rounded col-span-3"></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="h-8 bg-gray-200 rounded col-span-1"></div>
          <div className="h-8 bg-gray-200 rounded col-span-3"></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="h-8 bg-gray-200 rounded col-span-1"></div>
          <div className="h-8 bg-gray-200 rounded col-span-3"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded p-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="ml-2 space-y-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
