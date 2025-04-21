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
    <div className="mb-8 border-b pb-5">
      {/* Back button if backUrl is provided */}
      {backUrl && (
        <Link
          href={backUrl}
          className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          <span>Back</span>
        </Link>
      )}

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-300">/</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-500 mt-1">{description}</p>}
        </div>

        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
