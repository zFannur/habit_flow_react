import { create } from 'zustand';

export type ToastVariant = 'success' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
  variant?: ToastVariant;
  /** internal: авто-скрытие таймер, чтобы clearTimeout при ручном hideToast */
  _timerId?: ReturnType<typeof setTimeout>;
}

interface ToastStore {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id' | '_timerId'>) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const timerId = setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id, _timerId: timerId }] }));
  },
  hideToast: (id) =>
    set((state) => {
      const toast = state.toasts.find((t) => t.id === id);
      if (toast?._timerId !== undefined) {
        clearTimeout(toast._timerId);
      }
      return { toasts: state.toasts.filter((t) => t.id !== id) };
    }),
}));

export const showToast = (toast: Omit<ToastItem, 'id'>) =>
  useToastStore.getState().showToast(toast);
export const hideToast = (id: string) =>
  useToastStore.getState().hideToast(id);
