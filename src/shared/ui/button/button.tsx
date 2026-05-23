import React from 'react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconAtEnd?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  iconAtEnd = false,
  fullWidth = false,
  onClick,
  disabled,
  className = '',
  ...props
}) => {
  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    hapticFeedback.impactOccurred.ifAvailable('medium');
    if (onClick) onClick(e);
  };

  const baseStyles = 'inline-flex items-center justify-center rounded-hf-md transition-all duration-150 active:scale-[0.98] outline-none';
  const sizeStyles = size === 'sm'
    ? 'px-4 py-2 text-hf-label-md gap-1'
    : 'px-6 py-3 text-hf-label-lg gap-1.5';
  
  const variantStyles = {
    primary: 'bg-hf-accent text-white font-semibold active:bg-hf-accent/90',
    secondary: 'bg-transparent text-hf-accent border-[1.5px] border-hf-accent font-semibold active:bg-hf-accent/10',
    ghost: 'bg-transparent text-hf-text-secondary font-semibold active:bg-hf-text-secondary/10',
    danger: 'bg-hf-danger text-white font-semibold active:bg-hf-danger/90',
  }[variant];

  const widthStyles = fullWidth ? 'w-full' : 'w-auto';
  const disabledStyles = disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      onClick={handlePress}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyles} ${disabledStyles} ${className}`}
      {...props}
    >
      {icon && !iconAtEnd && <span className="flex items-center shrink-0">{icon}</span>}
      <span className="leading-tight">{label}</span>
      {icon && iconAtEnd && <span className="flex items-center shrink-0">{icon}</span>}
    </button>
  );
};
