'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-surface">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto flex items-center justify-center bg-primary/10 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 10c-.9-1-2.5-1.5-4-1.5s-3.1.5-4 1.5" />
            <path d="M8.5 15a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" />
            <path d="M15.5 15a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get
            you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft size={16} />
            Go Back
          </Button>

          <Button className="gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home size={16} />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
