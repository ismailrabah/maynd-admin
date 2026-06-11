import type { Ref } from 'vue';
interface ToastMessage { id: number; title: string; description?: string; color: 'success' | 'error' | 'warning' | 'info'; }
const toasts = ref<ToastMessage[]>([]);
let toastId = 0;
export function useToast() {
  const add = (options: Omit<ToastMessage, 'id'>) => {
    const id = ++toastId;
    toasts.value.push({ ...options, id });
    setTimeout(() => remove(id), 5000);
  };
  const remove = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) toasts.value.splice(index, 1);
  };
  return { toasts, add, remove };
}
