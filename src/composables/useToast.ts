import { ref } from 'vue';

export type ToastTone = 'success' | 'danger' | 'warning' | 'neutral';
export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

// Module-level singleton so any component can push a toast and one ToastHost renders them.
const toasts = ref<Toast[]>([]);
let seq = 0;

export function useToast() {
  const push = (message: string, tone: ToastTone = 'neutral') => {
    const id = ++seq;
    toasts.value = [...toasts.value.slice(-2), { id, message, tone }]; // cap at 3
    const ttl = tone === 'danger' ? 5000 : 3200;
    setTimeout(() => dismiss(id), ttl);
    return id;
  };
  const dismiss = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };
  return {
    toasts,
    dismiss,
    toast: (m: string) => push(m, 'neutral'),
    success: (m: string) => push(m, 'success'),
    error: (m: string) => push(m, 'danger'),
    warn: (m: string) => push(m, 'warning'),
  };
}
