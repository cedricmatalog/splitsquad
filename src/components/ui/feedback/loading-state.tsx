'use client';

import React from 'react';
import { Spinner } from './spinner';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <Spinner />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}
