<script setup lang="ts">
interface Props {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmVariant: 'primary',
  loading: false,
});

const emit = defineEmits(['confirm', 'cancel']);

const isOpen = ref(false);

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

const handleConfirm = () => {
  emit('confirm');
  close();
};

const handleCancel = () => {
  emit('cancel');
  close();
};

const variantClasses = {
  primary: 'bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white',
  danger: 'bg-[#ef4444] hover:bg-[#ef4444]/90 text-white',
  secondary: 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]',
};

defineExpose({ open, close });
</script>

<template>
  <UModal v-model="isOpen" :title="title">
    <div class="py-4">
      <p class="text-[var(--text-primary)]">{{ message }}</p>
    </div>
    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button class="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] rounded-lg border border-[var(--border-primary)] transition-colors" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors', variantClasses[confirmVariant]]" :disabled="loading" @click="handleConfirm">
          <span v-if="loading" class="flex items-center gap-2">
            <div class="spinner w-4 h-4" />
            Please wait...
          </span>
          <span v-else>{{ confirmText }}</span>
        </button>
      </div>
    </template>
  </UModal>
</template>