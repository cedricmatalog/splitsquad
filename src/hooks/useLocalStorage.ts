'use client';

import { useState, useEffect } from 'react';

/**
 * A hook for persisting and synchronizing state with localStorage
 *
 * @template T - The type of the stored value
 * @param {string} key - The localStorage key to store the value under
 * @param {T} initialValue - The initial value to use if no value exists in localStorage
 * @returns {[T, (value: T | ((val: T) => T)) => void]} A stateful value and a function to update it
 *
 * @example
 * // Store and retrieve a counter value
 * const [count, setCount] = useLocalStorage('count', 0);
 *
 * // Increment the counter
 * setCount(prevCount => prevCount + 1);
 */
function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then
  // parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  /**
   * Update both the state and localStorage value
   *
   * @param {T | ((val: T) => T)} value - New value or function to compute new value from previous one
   */
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save to state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Sync state between tabs
  useEffect(() => {
    /**
     * Handle storage changes from other tabs/windows
     * Updates the local state when localStorage is updated in another tab
     *
     * @param {StorageEvent} event - The storage event object
     */
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}

export default useLocalStorage;
