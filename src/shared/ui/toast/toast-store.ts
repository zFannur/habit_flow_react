import { create } from 'zustand';

export type ToastVariant = 'success' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
  variant?: ToastVariant;
}

interface ToastStore {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  hideToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const showToast = (toast: Omit<ToastItem, 'id'>) =>
  useToastStore.getState().showToast(toast);
export const hideToast = (id: string) =>
  useToastStore.getState().hideToast(id);
