import { useEffect, useState, RefObject } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * A hook that observes when an element enters the viewport
 * and returns a boolean indicating visibility.
 *
 * @param elementRef - Reference to the element to observe
 * @param options - Intersection observer options
 * @returns - Boolean indicating if the element is in viewport
 */
export function useLazyLoad(
  elementRef: RefObject<HTMLElement | Element | null>,
  options: UseLazyLoadOptions = {}
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const { threshold = 0.1, rootMargin = '0px' } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, rootMargin, isVisible]);

  return isVisible;
}
