import React from 'react';
import { useToastStore } from './toast-store';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-tg-safe-top left-0 right-0 z-50 flex flex-col items-center gap-2 p-4 pointer-events-none">
      {toasts.map((toast) => {
        const { id, title, message, variant = 'info', icon } = toast;

        const borderLeftColor = {
          success: 'border-l-hf-success',
          warning: 'border-l-hf-warning',
          info: 'border-l-hf-accent',
        }[variant];

        const iconColors = {
          success: 'text-hf-success bg-hf-success/10',
          warning: 'text-hf-warning bg-hf-warning/10',
          info: 'text-hf-accent bg-hf-accent/8',
        }[variant];

        const defaultIcon = {
          success: <CheckCircle className="w-[18px] h-[18px]" />,
          warning: <AlertTriangle className="w-[18px] h-[18px]" />,
          info: <Info className="w-[18px] h-[18px]" />,
        }[variant];

        return (
          <div
            key={id}
            className={`w-full max-w-sm bg-hf-card border border-hf-border border-l-4 ${borderLeftColor} rounded-[14px] shadow-hf-toast p-3.5 flex gap-3 pointer-events-auto transition-all`}
          >
            {/* Icon Tinted Box */}
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColors}`}
            >
              {icon || defaultIcon}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <h4 className="text-[14px] font-bold text-hf-text-primary leading-tight truncate">
                {title}
              </h4>
              <p className="text-[12px] text-hf-text-secondary leading-snug mt-0.5">
                {message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                hapticFeedback.impactOccurred.ifAvailable('light');
                hideToast(id);
              }}
              className="text-hf-text-secondary hover:text-hf-text-primary p-1 shrink-0 self-start"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
