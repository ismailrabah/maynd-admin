<script setup lang="ts">
interface Props {
  modelValue: string;
  placeholder?: string;
  debounce?: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
  debounce: 300,
  loading: false,
});

const emit = defineEmits(['update:modelValue']);

const internalValue = ref(props.modelValue);
const timeoutId = ref<NodeJS.Timeout | null>(null);

watch(() => props.modelValue, (val) => {
  internalValue.value = val;
});

const handleInput = () => {
  if (timeoutId.value) clearTimeout(timeoutId.value);
  
  timeoutId.value = setTimeout(() => {
    emit('update:modelValue', internalValue.value);
  }, props.debounce);
};

const handleClear = () => {
  internalValue.value = '';
  emit('update:modelValue', '');
};

onUnmounted(() => {
  if (timeoutId.value) clearTimeout(timeoutId.value);
});
</script>

<template>
  <div class="relative">
    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
      <span class="i-heroicons-magnifying-glass text-lg" />
    </div>
    <input
      v-model="internalValue"
      :placeholder="placeholder"
      class="w-full pl-12 pr-12 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
      @input="handleInput"
    />
    <div v-if="internalValue" class="absolute right-4 top-1/2 -translate-y-1/2">
      <button class="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" @click="handleClear">
        <span class="i-heroicons-x-mark text-lg" />
      </button>
    </div>
    <div v-if="loading" class="absolute right-4 top-1/2 -translate-y-1/2">
      <div class="spinner w-4 h-4" />
    </div>
  </div>
</template>