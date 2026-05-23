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
          ? 'bg-hf-accent border-hf-accent text-white'
          : 'bg-hf-card border-hf-border'
      }`}
    >
      {done && (
        <svg
          className="w-[15px] h-3 stroke-[2.2]"
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
