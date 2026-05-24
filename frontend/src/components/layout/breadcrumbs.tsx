'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs(): React.ReactElement {
  const pathname = usePathname() ?? '/';
  const parts = pathname.split('/').filter(Boolean);
  return (
    <nav aria-label="breadcrumbs" className="flex items-center text-sm text-muted-foreground">
      <Link href="/dashboard" className="flex items-center hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {parts.map((part, i) => {
        const href = '/' + parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;
        const label = part.replace(/-/g, ' ');
        return (
          <span key={href} className="flex items-center">
            <ChevronRight className="mx-1 h-4 w-4" />
            {isLast ? (
              <span className="font-medium capitalize text-foreground">{label}</span>
            ) : (
              <Link href={href} className="capitalize hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
