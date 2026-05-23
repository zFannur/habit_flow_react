import React from 'react';
import { Check } from 'lucide-react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface CheckboxProps {
  value: boolean;
  onChanged: (val: boolean) => void;
  label?: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  value,
  onChanged,
  label,
  className = '',
}) => {
  const handleClick = () => {
    hapticFeedback.impactOccurred.ifAvailable('light');
    onChanged(!value);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2.5 cursor-pointer select-none ${className}`}
    >
      <div
        className={`w-[22px] h-[22px] rounded-md transition-all duration-150 flex items-center justify-center ${
          value
            ? 'bg-tg-accent text-white active:scale-95'
            : 'bg-tg-bg border-[1.5px] border-tg-hint/25 active:scale-95'
        }`}
      >
        {value && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
      </div>
      {label && <span className="text-[15px] text-tg-text leading-tight">{label}</span>}
    </div>
  );
};
