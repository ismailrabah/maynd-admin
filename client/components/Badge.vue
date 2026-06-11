<script setup lang="ts">
interface Props {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  dot: false
});

const variantClasses = {
  success: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
  warning: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
  error: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
  info: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
  primary: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20',
  secondary: 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border-primary)]'
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm'
};
</script>

<template>
  <span class="inline-flex items-center gap-1.5 font-medium rounded-full border" :class="[variantClasses[variant], sizeClasses[size]]">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
    <slot />
  </span>
</template>