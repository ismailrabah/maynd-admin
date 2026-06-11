<script setup lang="ts">
interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  showPageNumbers?: boolean;
  showItemCount?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 10,
  showPageNumbers: true,
  showItemCount: true,
});

const emit = defineEmits(['update:currentPage']);

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page);
  }
};

const getPageNumbers = () => {
  const pages: (number | string)[] = [];
  const maxVisible = 7;
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(props.totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  if (end < props.totalPages) {
    if (end < props.totalPages - 1) pages.push('...');
    pages.push(props.totalPages);
  }
  
  return pages;
};
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between gap-4">
    <div v-if="showItemCount" class="text-sm text-[var(--text-muted)]">
      Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }}
    </div>
    <div class="flex items-center gap-2">
      <button class="p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
        <span class="i-heroicons-chevron-left text-lg" />
      </button>
      
      <template v-if="showPageNumbers">
        <button v-for="page in getPageNumbers()" :key="page" class="px-3 py-2 text-sm font-medium rounded-lg transition-colors min-w-[36px]" :class="{
          'bg-[var(--primary)] text-white': currentPage === page,
          'bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-tertiary)]': currentPage !== page,
          'cursor-not-allowed opacity-50': typeof page === 'string'
        }" :disabled="typeof page === 'string'" @click="typeof page === 'number' && goToPage(page)">
          {{ page }}
        </button>
      </template>
      
      <button class="p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
        <span class="i-heroicons-chevron-right text-lg" />
      </button>
    </div>
  </div>
</template>