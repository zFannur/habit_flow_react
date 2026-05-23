import { hapticFeedback } from '@telegram-apps/sdk-react';

interface CircleCheckProps {
  done: boolean;
  onTap: () => void;
}

export const CircleCheck = ({ done, onTap }: CircleCheckProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    onTap();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 border-2 shrink-0 ${
        done
          ? 'bg-tg-accent border-tg-accent text-white'
          : 'bg-tg-bg border-tg-border'
      }`}
    >
      {done && (
        <svg
          className="w-3.5 h-3.5 stroke-[2.5]"
          viewBox="0 0 15 12"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1.5 6L5.5 10L13.5 1.5" />
        </svg>
      )}
    </button>
  );
};
