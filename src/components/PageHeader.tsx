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
}

export function PageHeader({ title, description, breadcrumbs, backUrl }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {/* Back button if backUrl is provided */}
      {backUrl && (
        <Link 
          href={backUrl} 
          className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </Link>
      )}

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {item.href ? (
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      {description && <p className="text-gray-500">{description}</p>}
    </div>
  );
}
