<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const isAuthenticated = useState('isAuthenticated', () => false);
const user = useState('user', () => null);
const navItems = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/', requiresAuth: true },
  { label: 'Licenses', icon: 'i-heroicons-document-duplicate', to: '/licenses', requiresAuth: true },
  { label: 'Devices', icon: 'i-heroicons-device-computer', to: '/devices', requiresAuth: true },
  { label: 'Models', icon: 'i-heroicons-cube', to: '/models', requiresAuth: true },
  { label: 'Users', icon: 'i-heroicons-users', to: '/users', requiresAuth: true, adminOnly: true },
  { label: 'Settings', icon: 'i-heroicons-cog-6-tooth', to: '/settings', requiresAuth: true }
];
const isAdmin = computed(() => user.value?.role === 'superadmin' || user.value?.role === 'admin');
const logout = () => { localStorage.removeItem('maynd-admin-token'); localStorage.removeItem('maynd-admin-user'); isAuthenticated.value = false; user.value = null; router.push('/login'); };
onMounted(() => { const token = localStorage.getItem('maynd-admin-token'); const storedUser = localStorage.getItem('maynd-admin-user'); if (token && storedUser) { isAuthenticated.value = true; user.value = JSON.parse(storedUser); } });
watch(isAuthenticated, (authenticated) => { if (!authenticated && route.path !== '/login') router.push('/login'); });
</script>
<template>
  <div class="min-h-screen bg-[var(--bg-primary)]">
    <Toast />
    <aside class="fixed left-0 top-0 z-50 h-screen w-64 bg-[var(--surface-primary)] border-r border-[var(--border-primary)] flex flex-col">
      <div class="p-6"><div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-[#10b981] to-[#06b6d4] rounded-lg flex items-center justify-center"><span class="text-white font-bold text-xl">M</span></div>
        <div><h1 class="text-lg font-semibold text-[var(--text-primary)]">Maynd.ma</h1><p class="text-sm text-[var(--text-muted)]">Admin Panel</p></div>
      </div></div>
      <nav class="flex-1 px-4 py-4 space-y-2">
        <template v-for="item in navItems" :key="item.to">
          <NuxtLink v-if="!item.requiresAuth || isAuthenticated" :to="item.to" class="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]" :class="{ 'bg-[var(--surface-secondary)] text-[var(--text-primary)]': route.path === item.to || route.path.startsWith(item.to + '/'), 'hidden': item.adminOnly && !isAdmin }">
            <span :class="item.icon" class="w-5 h-5" /><span>{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>
      <div class="p-4 border-t border-[var(--border-primary)]" v-if="isAuthenticated && user">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center"><span class="text-white font-medium">{{ user.username.charAt(0).toUpperCase() }}</span></div>
          <div class="flex-1 min-w-0"><p class="font-medium text-[var(--text-primary)] truncate">{{ user.username }}</p><p class="text-sm text-[var(--text-muted)] truncate">{{ user.email }}</p></div>
        </div>
        <button @click="logout" class="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-[var(--text-secondary)] rounded-lg">
          <span class="i-heroicons-arrow-left-on-rectangle w-4 h-4" /><span>Logout</span>
        </button>
      </div>
    </aside>
    <main class="ml-64 min-h-screen">
      <header class="sticky top-0 z-40 bg-[var(--surface-primary)]/80 backdrop-blur border-b border-[var(--border-primary)]"><div class="flex items-center justify-between h-16 px-6">
        <div><h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ route.meta.title || 'Dashboard' }}</h2><p class="text-sm text-[var(--text-muted)]">{{ route.meta.description }}</p></div>
        <div class="flex items-center gap-4"><slot name="header-actions" /></div>
      </div></header>
      <div class="p-6"><slot /></div>
    </main>
  </div>
</template>
