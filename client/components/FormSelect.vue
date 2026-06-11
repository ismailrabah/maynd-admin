<script setup lang="ts">
interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface Props {
  modelValue: string | number | null;
  options: Option[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  placeholder: 'Select an option',
});

const emit = defineEmits(['update:modelValue']);

const handleChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  emit('update:modelValue', target.value || null);
};
</script>

<template>
  <div class="space-y-2">
    <div v-if="label" class="flex items-center gap-1">
      <label class="text-sm font-medium text-[var(--text-primary)]">
        {{ label }}
      </label>
      <span v-if="required" class="text-[#ef4444] text-sm">*</span>
    </div>
    <select
      :value="modelValue ?? ''"
      :disabled="disabled"
      class="w-full px-4 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      @change="handleChange"
    >
      <option value="" disabled selected class="text-[var(--text-muted)]">
        {{ placeholder }}
      </option>
      <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled" class="text-[var(--text-primary)]">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="text-sm text-[#ef4444]">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-[var(--text-muted)]">
      {{ hint }}
    </p>
  </div>
</template>