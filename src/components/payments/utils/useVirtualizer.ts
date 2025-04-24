import { useState, useEffect, useCallback } from 'react';

interface VirtualizerOptions {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: (index: number) => number;
  overscan?: number;
  paddingStart?: number;
  paddingEnd?: number;
}

interface VirtualItem {
  index: number;
  size: number;
  start: number;
  end: number;
  measureRef?: (el: Element | null) => void;
}

export function useVirtualizer(options: VirtualizerOptions) {
  const {
    count,
    getScrollElement,
    estimateSize,
    overscan = 3,
    paddingStart = 0,
    paddingEnd = 0,
  } = options;

  const [scrollOffset, setScrollOffset] = useState(0);
  const [measuredSizes, setMeasuredSizes] = useState<Record<number, number>>({});

  // Calculate the range of items to render
  const calculateRange = useCallback(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return { start: 0, end: Math.min(count, 20) };

    const { clientHeight } = scrollElement;
    let itemStart = 0;
    let itemEnd = 0;

    let currentOffset = paddingStart;

    // Find the first item that starts after the scroll offset
    for (let i = 0; i < count; i++) {
      const size = measuredSizes[i] ?? estimateSize(i);
      const prevOffset = currentOffset;
      currentOffset += size;

      if (prevOffset <= scrollOffset && scrollOffset <= currentOffset) {
        itemStart = i;
        break;
      }
    }

    // Find the last item that ends after the viewport
    currentOffset = paddingStart;
    for (let i = 0; i < count; i++) {
      const size = measuredSizes[i] ?? estimateSize(i);
      currentOffset += size;

      if (currentOffset >= scrollOffset + clientHeight) {
        itemEnd = i;
        break;
      }
    }

    // Add overscan
    const start = Math.max(0, itemStart - overscan);
    const end = Math.min(count - 1, itemEnd + overscan);

    return { start, end };
  }, [count, getScrollElement, estimateSize, measuredSizes, overscan, paddingStart, scrollOffset]);

  const [range, setRange] = useState(() => calculateRange());

  // Handle scroll events
  useEffect(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    const handleScroll = () => {
      setScrollOffset(scrollElement.scrollTop);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [getScrollElement]);

  // Recalculate range when dependencies change
  useEffect(() => {
    setRange(calculateRange());
  }, [calculateRange]);

  // Calculate the total size of all items
  const getTotalSize = useCallback(() => {
    let totalSize = paddingStart + paddingEnd;
    for (let i = 0; i < count; i++) {
      totalSize += measuredSizes[i] ?? estimateSize(i);
    }
    return totalSize;
  }, [count, estimateSize, measuredSizes, paddingStart, paddingEnd]);

  // Get the virtual items to render
  const getVirtualItems = useCallback(() => {
    const { start, end } = range;
    const items: VirtualItem[] = [];

    let currentOffset = paddingStart;
    for (let i = 0; i < count; i++) {
      const size = measuredSizes[i] ?? estimateSize(i);

      if (i >= start && i <= end) {
        items.push({
          index: i,
          size,
          start: currentOffset,
          end: currentOffset + size,
        });
      }

      currentOffset += size;
    }

    return items;
  }, [range, count, measuredSizes, estimateSize, paddingStart]);

  // Measure an element's size
  const measureElement = useCallback((index: number, element: Element | null) => {
    if (element) {
      const size = element.getBoundingClientRect().height;
      setMeasuredSizes(prev => {
        if (prev[index] === size) return prev;
        return { ...prev, [index]: size };
      });
    }
  }, []);

  // Create a ref to measure an element
  const measureElementRef = useCallback(
    (index: number) => {
      return (element: Element | null) => measureElement(index, element);
    },
    [measureElement]
  );

  // Add measureRef to virtual items
  const virtualItems = getVirtualItems().map(item => ({
    ...item,
    measureRef: measureElementRef(item.index),
  }));

  return {
    virtualItems,
    totalSize: getTotalSize(),
    scrollOffset,
    getVirtualItems: () => virtualItems,
    getTotalSize,
  };
}
