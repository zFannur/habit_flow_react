import React from 'react';

interface StreakBadgeProps {
  days: number;
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ days, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-[8px] py-[3px] rounded-hf-full text-hf-label-sm bg-hf-warning/12 text-hf-warning select-none ${className}`}
    >
      🔥 {days}
    </span>
  );
};
