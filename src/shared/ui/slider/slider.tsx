import React from 'react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface SliderProps {
  value: number;
  onChanged: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChanged,
  min = 0,
  max = 100,
  step = 1,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    // Trigger haptic selection change feedback during slide
    hapticFeedback.selectionChanged.ifAvailable();
    onChanged(val);
  };

  return (
    <div className={`w-full py-2 flex items-center ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-[4px] bg-tg-secondary-bg rounded-lg appearance-none cursor-pointer outline-none
          accent-tg-accent
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-tg-accent
          [&::-webkit-slider-thumb]:border-[3px]
          [&::-webkit-slider-thumb]:border-tg-bg
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:appearance-none
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-tg-accent
          [&::-moz-range-thumb]:border-[3px]
          [&::-moz-range-thumb]:border-tg-bg
          [&::-moz-range-thumb]:shadow-md
          [&::-moz-range-thumb]:border-none"
      />
    </div>
  );
};
