'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Polyfill for ResizeObserver in test environment
const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

// Create a mock ResizeObserver if in test environment
const getResizeObserver = (callback: ResizeObserverCallback) => {
  if (isTestEnvironment) {
    // Return a mock implementation for tests
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    };
  }

  // Use the real ResizeObserver in browser environments
  return new ResizeObserver(callback);
};

interface UseVirtualListOptions<T extends HTMLElement = HTMLDivElement> {
  itemCount: number;
  itemHeight: number | ((index: number) => number);
  overscan?: number;
  scrollingDelay?: number;
  containerRef?: React.RefObject<T | null>;
}

interface VirtualItem {
  index: number;
  offsetTop: number;
  height: number;
}

/**
 * A lightweight hook for virtualizing large lists with minimal overhead.
 * Only renders items that are visible in the viewport plus overscan buffer.
 *
 * @param options - Configuration options for the virtual list
 * @returns - Virtualization utilities and state
 */
export function useVirtualList<T extends HTMLElement = HTMLDivElement>(
  options: UseVirtualListOptions<T>
) {
  const {
    itemCount,
    itemHeight,
    overscan = 5,
    scrollingDelay = 150,
    containerRef: externalContainerRef,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalContainerRef = useRef<T | null>(null);

  // Use either the external ref or the internal one
  const containerRef = externalContainerRef || internalContainerRef;

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    setScrollTop(containerRef.current.scrollTop);
    setIsScrolling(true);

    // Reset scrolling state after delay
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }

    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
  }, [scrollingDelay, containerRef]);

  // Add scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [handleScroll, containerRef]);

  // Update container height on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = getResizeObserver(updateHeight);
    if (!isTestEnvironment) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Calculate visible range based on current scroll position
  const range = useMemo(() => {
    if (containerHeight === 0) {
      return { start: 0, end: 10 };
    }

    const getItemHeight = typeof itemHeight === 'function' ? itemHeight : () => itemHeight;

    // Estimate the range of visible items
    let startIndex = 0;
    let endIndex = 0;
    let currentOffset = 0;

    // Find the first visible item
    for (let i = 0; i < itemCount; i++) {
      const height = getItemHeight(i);
      if (currentOffset + height > scrollTop) {
        startIndex = i;
        break;
      }
      currentOffset += height;
    }

    // Find the last visible item
    currentOffset = 0;
    for (let i = 0; i < itemCount; i++) {
      const height = getItemHeight(i);
      currentOffset += height;
      if (currentOffset > scrollTop + containerHeight) {
        endIndex = i;
        break;
      }
    }

    // Add overscan
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(itemCount - 1, endIndex + overscan);

    return { start: startIndex, end: endIndex };
  }, [scrollTop, containerHeight, itemHeight, itemCount, overscan]);

  // Calculate total content height
  const totalHeight = useMemo(() => {
    const getItemHeight = typeof itemHeight === 'function' ? itemHeight : () => itemHeight;

    let height = 0;
    for (let i = 0; i < itemCount; i++) {
      height += getItemHeight(i);
    }

    return height;
  }, [itemHeight, itemCount]);

  // Create virtual items
  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = [];
    const getItemHeight = typeof itemHeight === 'function' ? itemHeight : () => itemHeight;

    let currentOffset = 0;
    for (let i = 0; i < itemCount; i++) {
      const height = getItemHeight(i);

      if (i >= range.start && i <= range.end) {
        items.push({
          index: i,
          offsetTop: currentOffset,
          height,
        });
      }

      currentOffset += height;
    }

    return items;
  }, [range, itemHeight, itemCount]);

  return {
    containerRef,
    virtualItems,
    totalHeight,
    isScrolling,
    scrollTop,
  };
}

// Re-export existing hooks for consistency
export * from './useLazyLoad';
export * from './useLocalStorage';
