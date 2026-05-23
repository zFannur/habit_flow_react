import React from 'react';

interface SectionLabelProps {
  label: string;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ label, className = '' }) => {
  return (
    <div className={`w-full bg-hf-bg-secondary px-5 pt-6 pb-2.5 select-none ${className}`}>
      <span className="text-hf-label-sm uppercase tracking-[0.08em] text-hf-text-tertiary font-bold">
        {label}
      </span>
    </div>
  );
};
