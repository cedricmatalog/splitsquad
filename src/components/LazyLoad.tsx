import React, { useRef, ReactNode } from 'react';
import { useLazyLoad } from '@/hooks/useLazyLoad';

interface LazyLoadProps {
  children: ReactNode;
  height?: string;
  width?: string;
  placeholder?: ReactNode;
  threshold?: number;
  className?: string;
}

export function LazyLoad({
  children,
  height = 'auto',
  width = '100%',
  placeholder,
  threshold = 0.1,
  className = '',
}: LazyLoadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useLazyLoad(containerRef, { threshold });

  return (
    <div ref={containerRef} style={{ height, width, minHeight: '20px' }} className={className}>
      {isVisible
        ? children
        : placeholder || <div className="w-full h-full animate-pulse bg-gray-200 rounded-md" />}
    </div>
  );
}

// Usage example:
// import { LazyLoad } from '@/components/LazyLoad';
//
// <LazyLoad height="400px">
//   <ExpensiveComponent />
// </LazyLoad>
//
// Or with a custom placeholder:
// <LazyLoad
//   height="300px"
//   placeholder={<div className="flex items-center justify-center h-full">Loading...</div>}
// >
//   <DataChart data={largeDataSet} />
// </LazyLoad>
