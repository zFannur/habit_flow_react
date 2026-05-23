import React from 'react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onTap?: () => void;
  padding?: string;
  borderColor?: string;
  borderWidth?: number;
  background?: string;
  opacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onTap,
  padding = 'p-4',
  borderColor = 'border-hf-border',
  borderWidth = 1,
  background = 'bg-hf-card',
  opacity = 1,
  className = '',
  style,
  ...props
}) => {
  const handleClick = () => {
    if (onTap) {
      hapticFeedback.impactOccurred.ifAvailable('light');
      onTap();
    }
  };

  const cardStyles = `rounded-hf-lg shadow-hf-card transition-all duration-150 ${padding} ${background} ${className}`;
  const clickableStyles = onTap ? 'cursor-pointer active:scale-[0.99] active:opacity-90' : '';

  return (
    <div
      onClick={onTap ? handleClick : undefined}
      className={`${cardStyles} ${clickableStyles}`}
      style={{
        border: `${borderWidth}px solid`,
        borderColor: borderColor.startsWith('border-') ? undefined : borderColor,
        opacity,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
