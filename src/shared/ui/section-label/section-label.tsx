import React from 'react';

interface SectionLabelProps {
  label: string;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ label, className = '' }) => {
  return (
    <div className={`w-full bg-tg-secondary-bg px-5 pt-6 pb-2.5 select-none ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-tg-hint">
        {label}
      </span>
    </div>
  );
};
