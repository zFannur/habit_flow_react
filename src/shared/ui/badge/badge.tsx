import React from 'react';

export type BadgeVariant = 'streak' | 'newBadge' | 'premium' | 'done';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'newBadge',
  className = '',
}) => {
  const variantStyles = {
    streak: 'bg-amber-500/12 text-amber-600 dark:text-amber-500', 
    newBadge: 'bg-tg-accent/12 text-tg-accent', 
    premium: 'bg-purple-500/12 text-purple-600 dark:text-purple-400', 
    done: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-500', 
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-[0.02em] leading-tight select-none ${variantStyles} ${className}`}
    >
      {label}
    </span>
  );
};
