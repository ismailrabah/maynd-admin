<template>
  <div class="min-h-screen bg-[var(--bg-primary)] flex flex-col">
    <header class="py-6 px-6"><div class="container mx-auto flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-[#10b981] to-[#06b6d4] rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-xl">M</span>
        </div>
        <div><h1 class="text-lg font-semibold text-[var(--text-primary)]">Maynd.ma</h1><p class="text-sm text-[var(--text-muted)]">Admin Panel</p></div>
      </NuxtLink>
    </div></header>
    <main class="flex-1 flex items-center justify-center py-12 px-6"><div class="w-full max-w-md"><slot /></div></main>
    <footer class="py-6 px-6 text-center"><p class="text-sm text-[var(--text-muted)]">� 2026 Maynd.ma. All rights reserved.</p></footer>
  </div>
</template>
