import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface HeaderBarProps {
  title: string;
  onBack: () => void;
  trailing?: React.ReactNode;
  className?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onBack,
  trailing,
  className = '',
}) => {
  const handleBackClick = () => {
    hapticFeedback.impactOccurred.ifAvailable('light');
    onBack();
  };

  return (
    <header
      className={`w-full bg-hf-bg-primary border-b border-hf-border flex items-center px-4 pt-tg-safe-top pb-3 gap-1 ${className}`}
    >
      <button
        onClick={handleBackClick}
        className="text-hf-accent hover:opacity-80 active:scale-95 transition-all p-2 -ml-2 rounded-hf-md flex items-center justify-center min-w-[36px] min-h-[36px]"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="flex-1 text-[20px] font-bold text-hf-text-primary tracking-[-0.02em] truncate">
        {title}
      </h1>
      {trailing && <div className="shrink-0 flex items-center">{trailing}</div>}
    </header>
  );
};
