<script setup lang="ts">
interface Props {
  columns: { key: string; label: string; sortable?: boolean }[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'No data available',
});

const emit = defineEmits(['rowClick']);

const sortKey = ref<string | null>(null);
const sortDirection = ref<'asc' | 'desc'>('asc');

const sortedData = computed(() => {
  if (!sortKey.value) return props.data;
  return [...props.data].sort((a, b) => {
    const aVal = a[sortKey.value!];
    const bVal = b[sortKey.value!];
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
};

const handleRowClick = (row: any) => {
  emit('rowClick', row);
};
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-[var(--border-primary)] bg-[var(--surface-secondary)]">
    <table class="w-full">
      <thead>
        <tr class="border-b border-[var(--border-primary)]">
          <th v-for="column in columns" :key="column.key" class="px-6 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider" :class="{ 'cursor-pointer hover:bg-[var(--surface-tertiary)]': column.sortable }" @click="column.sortable && toggleSort(column.key)">
            <div class="flex items-center gap-1">
              {{ column.label }}
              <span v-if="column.sortable" class="i-heroicons-chevron-up-down text-[var(--text-muted)] text-sm" />
              <span v-if="sortKey === column.key" class="i-heroicons-chevron-up text-[var(--primary)] text-sm" :class="{ 'rotate-180': sortDirection === 'desc' }" />
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-6 py-8 text-center">
            <div class="flex items-center justify-center gap-2">
              <div class="spinner w-5 h-5" />
              <span class="text-[var(--text-muted)]">Loading...</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="sortedData.length === 0">
          <td :colspan="columns.length" class="px-6 py-8 text-center text-[var(--text-muted)]">
            {{ emptyMessage }}
          </td>
        </tr>
        <tr v-else v-for="(row, index) in sortedData" :key="index" class="border-b border-[var(--border-primary)] hover:bg-[var(--surface-tertiary)] transition-colors" @click="handleRowClick(row)">
          <td v-for="column in columns" :key="column.key" class="px-6 py-4 text-sm text-[var(--text-primary)]">
            <slot :name="column.key" :row="row">
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>