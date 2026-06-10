import React, { useEffect, useState } from 'react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet = ({ isOpen, onClose, title, children }: BottomSheetProps) => {
  // mounted: контролирует наличие DOM-узла; visible: включает transition в translate-y-0
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred('light');
      }
      // Монтируем узел, затем в следующем кадре переключаем visible → transition играет
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      // Убираем visible → transition уходит вниз, затем демонтируем
      setVisible(false);
    }
  }, [isOpen]);

  // Демонтируем после завершения transition закрытия (300 ms)
  useEffect(() => {
    if (!visible && mounted) {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, mounted]);

  // Блокируем прокрутку фона пока шторка открыта
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        onClick={() => {
          if (hapticFeedback.impactOccurred.isAvailable()) {
            hapticFeedback.impactOccurred('light');
          }
          onClose();
        }}
      />

      {/* Sheet Container */}
      <div
        className={`relative w-full max-w-md bg-hf-bg-primary rounded-t-2xl shadow-xl flex flex-col p-4 pb-[calc(16px+var(--tg-viewport-safe-area-inset-bottom,0px))] transition-transform duration-300 transform ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          borderTop: '1px solid var(--hf-bg-secondary, rgba(0, 0, 0, 0.08))',
        }}
      >
        {/* Drag Handle */}
        <div className="w-10 h-1 bg-hf-text-secondary/20 rounded-full mx-auto mb-4" />

        {/* Title */}
        {title && (
          <h3 className="text-lg font-bold text-hf-text-primary mb-4 px-1">
            {title}
          </h3>
        )}

        {/* Content */}
        <div className="flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>
  );
};
