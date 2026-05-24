'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SimpleSelectOption {
  label: string;
  value: string;
}

interface Props extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SimpleSelectOption[];
  placeholder?: string;
}

/**
 * Lightweight native <select> with consistent styling.
 * For richer combobox behaviour, swap to @radix-ui/react-select.
 */
export const Select = React.forwardRef<HTMLSelectElement, Props>(
  ({ className, options, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
    </div>
  ),
);
Select.displayName = 'Select';
