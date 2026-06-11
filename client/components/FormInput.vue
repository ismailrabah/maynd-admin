<script setup lang="ts">
interface Props {
  modelValue: string | number;
  label?: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
});

const emit = defineEmits(['update:modelValue']);

const inputRef = ref<HTMLInputElement | null>(null);

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const focus = () => {
  inputRef.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <div class="space-y-2">
    <div v-if="label" class="flex items-center gap-1">
      <label class="text-sm font-medium text-[var(--text-primary)]" :for="label">
        {{ label }}
      </label>
      <span v-if="required" class="text-[#ef4444] text-sm">*</span>
    </div>
    <input
      :id="label"
      ref="inputRef"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full px-4 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      @input="handleInput"
    />
    <p v-if="error" class="text-sm text-[#ef4444]">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-[var(--text-muted)]">
      {{ hint }}
    </p>
  </div>
</template>