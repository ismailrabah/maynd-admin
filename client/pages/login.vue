<script setup lang="ts">
definePageMeta({ layout: 'auth', title: 'Login' });
const config = useRuntimeConfig();
const router = useRouter();
const form = reactive({ username: '', password: '', remember: false });
const isLoading = ref(false);
const error = ref<string | null>(null);
const login = async () => {
  error.value = null; isLoading.value = true;
  try {
    const response = await $fetch(`${config.public.apiBase}/auth/login`, { method: 'POST', body: { username: form.username, password: form.password } });
    if (response.success) {
      localStorage.setItem('maynd-admin-token', response.data.token);
      localStorage.setItem('maynd-admin-user', JSON.stringify(response.data.user));
      useState('isAuthenticated').value = true; useState('user').value = response.data.user;
      router.push('/');
    } else { error.value = response.error || 'Login failed'; }
  } catch (err) { error.value = 'Invalid username or password'; console.error('Login error:', err); }
  finally { isLoading.value = false; }
};
const handleKeydown = (e: KeyboardEvent) => { if (e.key === 'Enter' && !isLoading.value) login(); };
onMounted(() => { const token = localStorage.getItem('maynd-admin-token'); if (token) router.push('/'); });
</script>

<template>
  <div class="animate-fade-in">
    <div class="text-center mb-8"><h1 class="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome back</h1><p class="text-[var(--text-secondary)]">Sign in to manage Maynd.ma</p></div>
    <form @submit.prevent="login" class="space-y-5">
      <div v-if="error" class="alert alert-error"><span class="i-heroicons-exclamation-circle w-5 h-5" /><span>{{ error }}</span></div>
      <div class="form-group"><label class="label">Username or Email</label><input id="username" v-model="form.username" type="text" placeholder="Enter your username or email" class="input" required @keydown="handleKeydown" /></div>
      <div class="form-group"><label class="label">Password</label><input id="password" v-model="form.password" type="password" placeholder="Enter your password" class="input" required @keydown="handleKeydown" /></div>
      <div class="flex items-center justify-between"><label class="flex items-center gap-2 cursor-pointer"><input v-model="form.remember" type="checkbox" class="w-4 h-4 accent-[#10b981]" /><span class="text-sm text-[var(--text-secondary)]">Remember me</span></label></div>
      <button type="submit" class="btn btn-primary w-full" :disabled="isLoading || !form.username || !form.password"><span v-if="isLoading" class="spinner w-4 h-4" /><span v-else>Sign in</span></button>
    </form>
  </div>
</template>