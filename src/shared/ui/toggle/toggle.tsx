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
      {/* Toggle Track */}
      <div
        onClick={handleToggle}
        className={`w-12 h-7 rounded-full transition-all duration-200 cursor-pointer relative ${
          value ? 'bg-tg-accent' : 'bg-tg-secondary-bg'
        }`}
      >
        {/* Toggle Thumb */}
        <div
          className={`w-5.5 h-5.5 rounded-full transition-all duration-200 shadow-sm absolute top-0.5 ${
            value
              ? 'left-[26px] bg-white'
              : 'left-0.5 bg-tg-hint'
          }`}
        />
      </div>
      {label && <span className="text-[15px] text-tg-text leading-tight">{label}</span>}
    </div>
  );
};
