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
    streak: 'bg-hf-warning/12 text-hf-warning',
    newBadge: 'bg-hf-accent/12 text-hf-accent',
    premium: 'bg-hf-premium/12 text-hf-premium',
    done: 'bg-hf-success/12 text-hf-success',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-[3px] rounded-hf-full text-hf-label-sm tracking-[0.02em] select-none ${variantStyles} ${className}`}
    >
      {label}
    </span>
  );
};
