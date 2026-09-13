import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'indigo';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-indigo-100 text-indigo-700',
  indigo: 'bg-indigo-100 text-indigo-700 border border-indigo-200/60',
  success: 'bg-emerald-100 text-emerald-700 border border-emerald-200/60',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200/60',
  danger: 'bg-red-100 text-red-700 border border-red-200/60',
  info: 'bg-sky-100 text-sky-700 border border-sky-200/60',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold tracking-wide
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
