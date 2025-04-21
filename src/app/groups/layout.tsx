import { ReactNode } from 'react';
/**
 * GroupsLayout Component
 *
 * This layout component wraps all group-related pages and provides a consistent layout structure.
 * It's used by Next.js to apply the same layout to all pages under the /groups route.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to be rendered within the layout
 * @returns {JSX.Element} The layout component with its children
 */

export default function GroupsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
