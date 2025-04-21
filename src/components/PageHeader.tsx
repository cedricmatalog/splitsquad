'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  backUrl?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, backUrl, action }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 border-b pb-4 sm:pb-5">
      <div className="flex flex-col space-y-2">
        {/* Back button if backUrl is provided */}
        {backUrl && (
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1 text-sm text-gray-500 mb-1 sm:mb-3 hover:text-primary transition-colors -ml-1"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
            <span>Back</span>
          </Link>
        )}

        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 mb-2 sm:mb-3 overflow-x-auto scrollbar-none">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2 min-w-fit">
                {index > 0 && <span className="text-gray-300">/</span>}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-primary hover:underline transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium whitespace-nowrap">{item.label}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{title}</h1>
            {description && <p className="text-sm sm:text-base text-gray-500">{description}</p>}
          </div>

          {action && <div className="sm:flex-shrink-0 self-start sm:self-center">{action}</div>}
        </div>
      </div>
    </div>
  );
}
