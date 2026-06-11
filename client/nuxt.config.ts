// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  modules: ['@nuxt/ui'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  devServer: {
    port: 3001,
    host: 'localhost'
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:4000/api',
      appName: 'Maynd.ma Admin',
      appVersion: '1.0.0'
    }
  },
  app: {
    head: {
      title: 'Maynd.ma Admin',
      meta: [{ name: 'description', content: 'Maynd.ma Admin Dashboard' }],
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1'
    }
  },
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['@nuxt/ui']
  }
});
