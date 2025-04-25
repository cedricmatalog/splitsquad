import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges Tailwind CSS classes with proper precedence
 *
 * This utility combines the power of clsx and tailwind-merge:
 * - clsx allows for conditional classes and array/object syntax
 * - tailwind-merge properly handles Tailwind CSS class conflicts
 *
 * @param {...ClassValue[]} inputs - The class values to merge
 * @returns {string} The merged class string with proper precedence
 *
 * @example
 * // Basic usage
 * <div className={cn("text-red-500", "bg-blue-500")}>
 *
 * // With conditionals
 * <div className={cn("base-class", isActive && "active-class")}>
 *
 * // With overrides
 * <div className={cn("text-sm", "text-lg")}>  // text-lg wins
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
