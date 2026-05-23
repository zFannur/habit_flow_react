import React from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-9 py-6 ${className}`}
    >
      <div className="text-[72px] leading-none select-none">{emoji}</div>
      <h3 className="text-[18px] font-bold text-hf-text-primary leading-tight mt-6 tracking-[-0.01em]">
        {title}
      </h3>
      {description && (
        <p className="text-hf-body-md text-hf-text-secondary mt-2.5 max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-7 w-full flex justify-center">{action}</div>}
      {secondaryAction && <div className="mt-3 w-full flex justify-center">{secondaryAction}</div>}
    </div>
  );
};
