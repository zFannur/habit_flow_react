import React from 'react';

interface StreakBadgeProps {
  days: number;
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ days, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/12 text-amber-600 dark:text-amber-500 select-none ${className}`}
    >
      🔥 {days}
    </span>
  );
};
