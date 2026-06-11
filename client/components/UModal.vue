<script setup lang="ts">
const props = defineProps({ modelValue: Boolean, title: String, size: { type: String, default: 'md' } });
const emit = defineEmits(['update:modelValue']);
const close = () => emit('update:modelValue', false);
const handleKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
const handleBackdropClick = (e: MouseEvent) => { if (e.target === e.currentTarget) close(); };
onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', full: 'max-w-[90vw] max-h-[90vh]' };
</script>
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click="handleBackdropClick">
        <Transition name="fade"><div v-if="modelValue" class="fixed inset-0 bg-black/50 backdrop-blur-sm" /></Transition>
        <div class="relative w-full bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-xl shadow-xl overflow-hidden" :class="sizeClasses[size as keyof typeof sizeClasses]">
          <div class="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ title }}</h2>
            <button @click="close" class="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] rounded-lg">
              <span class="i-heroicons-x-mark w-5 h-5" />
            </button>
          </div>
          <div class="p-6"><slot /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<style scoped>.modal-enter-active,.modal-leave-active{transition:opacity 0.2s ease;}.modal-enter-from,.modal-leave-to{opacity:0;}.fade-enter-active,.fade-leave-active{transition:opacity 0.2s ease;}.fade-enter-from,.fade-leave-to{opacity:0;}</style>
