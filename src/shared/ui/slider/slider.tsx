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
    // touchAction:'none' + stopPropagation предотвращают срабатывание swipeBehavior SDK
    // при горизонтальном драге по слайдеру, не ломая вертикальный скролл страницы
    <div
      className={`w-full py-2 flex items-center ${className}`}
      style={{ touchAction: 'pan-y' }}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-[4px] bg-hf-bg-tertiary rounded-lg appearance-none cursor-pointer outline-none
          accent-hf-accent
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-hf-accent
          [&::-webkit-slider-thumb]:border-[3px]
          [&::-webkit-slider-thumb]:border-hf-card
          [&::-webkit-slider-thumb]:shadow-hf-thumb
          [&::-webkit-slider-thumb]:appearance-none
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-hf-accent
          [&::-moz-range-thumb]:border-[3px]
          [&::-moz-range-thumb]:border-hf-card
          [&::-moz-range-thumb]:shadow-hf-thumb
          [&::-moz-range-thumb]:border-none"
      />
    </div>
  );
};
