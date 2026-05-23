import React from 'react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface ToggleProps {
  value: boolean;
  onChanged: (val: boolean) => void;
  label?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onChanged,
  label,
  className = '',
}) => {
  const handleToggle = () => {
    hapticFeedback.impactOccurred.ifAvailable('light');
    onChanged(!value);
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        onClick={handleToggle}
        className={`w-12 h-7 rounded-full transition-all duration-200 cursor-pointer relative ${
          value ? 'bg-hf-accent' : 'bg-hf-bg-tertiary'
        }`}
      >
        <div
          className={`w-[22px] h-[22px] rounded-full transition-all duration-200 shadow-hf-toggle-thumb absolute top-[3px] ${
            value
              ? 'left-[23px] bg-white'
              : 'left-[3px] bg-hf-text-tertiary'
          }`}
        />
      </div>
      {label && <span className="text-hf-body-md text-hf-text-primary">{label}</span>}
    </div>
  );
};
