<script setup lang="ts">
definePageMeta({ title: 'Dashboard', description: 'Overview of Maynd.ma' });
const config = useRuntimeConfig();
const stats = ref(null);
const isLoading = ref(true);
const fetchStats = async () => {
  try {
    const response = await $fetch(`${config.public.apiBase}/stats`, { headers: { Authorization: `Bearer ${localStorage.getItem('maynd-admin-token')}` } });
    if (response.success) stats.value = response.data;
  } catch (err) { console.error('Fetch stats error:', err); } finally { isLoading.value = false; }
};
const formatNumber = (num: number) => num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();
onMounted(() => fetchStats());
</script>
<template>
  <div class="space-y-6 animate-fade-in">
    <div><h1 class="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1><p class="text-[var(--text-muted)]">Overview of Maynd.ma system</p></div>
    <div v-if="isLoading" class="empty-state"><div class="spinner w-8 h-8" /><p class="text-[var(--text-muted)]">Loading...</p></div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card"><div class="flex items-center justify-between mb-4"><div><p class="text-sm text-[var(--text-muted)]">Total Licenses</p><p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats ? formatNumber(stats.total_licenses) : '0' }}</p></div><div class="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center"><span class="i-heroicons-document-duplicate text-2xl text-[#10b981]" /></div></div><div class="flex items-center gap-2 text-sm text-[var(--text-muted)]"><span class="w-2 h-2 bg-[#10b981] rounded-full" /><span>{{ stats ? formatNumber(stats.active_licenses) : '0' }} Active</span></div></div>
      <div class="card"><div class="flex items-center justify-between mb-4"><div><p class="text-sm text-[var(--text-muted)]">Total Devices</p><p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats ? formatNumber(stats.total_devices) : '0' }}</p></div><div class="w-12 h-12 bg-[#3b82f6]/10 rounded-xl flex items-center justify-center"><span class="i-heroicons-device-computer text-2xl text-[#3b82f6]" /></div></div><div class="flex items-center gap-2 text-sm text-[var(--text-muted)]"><span class="w-2 h-2 bg-[#10b981] rounded-full" /><span>{{ stats ? formatNumber(stats.active_devices) : '0' }} Active</span></div></div>
      <div class="card"><div class="flex items-center justify-between mb-4"><div><p class="text-sm text-[var(--text-muted)]">Total Users</p><p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats ? formatNumber(stats.total_users) : '0' }}</p></div><div class="w-12 h-12 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center"><span class="i-heroicons-users text-2xl text-[#f59e0b]" /></div></div><div class="flex items-center gap-2 text-sm text-[var(--text-muted)]"><span class="w-2 h-2 bg-[#f59e0b] rounded-full" /><span>Admin Users</span></div></div>
      <div class="card"><div class="flex items-center justify-between mb-4"><div><p class="text-sm text-[var(--text-muted)]">AI Models</p><p class="text-3xl font-bold text-[var(--text-primary)]">{{ stats ? formatNumber(stats.total_models) : '0' }}</p></div><div class="w-12 h-12 bg-[#ec4899]/10 rounded-xl flex items-center justify-center"><span class="i-heroicons-cube text-2xl text-[#ec4899]" /></div></div><div class="flex items-center gap-2 text-sm text-[var(--text-muted)]"><span class="w-2 h-2 bg-[#ec4899] rounded-full" /><span>Available Models</span></div></div>
    </div>
  </div>
</template>
