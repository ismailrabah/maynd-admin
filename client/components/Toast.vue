<script setup lang="ts">
const { toasts, remove } = useToast();
const getColorClasses = (color: string) => {
  const colors = { success: 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]', error: 'bg-[#ef4444]/10 border-[#ef4444] text-[#ef4444]', warning: 'bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b]', info: 'bg-[#3b82f6]/10 border-[#3b82f6] text-[#3b82f6]' };
  return colors[color as keyof typeof colors] || 'bg-gray-800 border-gray-600 text-white';
};
const getIcon = (color: string) => {
  const icons = { success: 'i-heroicons-check-circle', error: 'i-heroicons-exclamation-circle', warning: 'i-heroicons-exclamation-triangle', info: 'i-heroicons-information-circle' };
  return icons[color as keyof typeof icons] || 'i-heroicons-bell';
};
</script>
<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
    <div v-for="toast in toasts" :key="toast.id" class="alert animate-slide-up" :class="getColorClasses(toast.color)" @click="remove(toast.id)">
      <span :class="getIcon(toast.color)" class="w-5 h-5" />
      <div><p class="font-medium">{{ toast.title }}</p><p v-if="toast.description" class="text-sm opacity-80">{{ toast.description }}</p></div>
    </div>
  </div>
</template>
