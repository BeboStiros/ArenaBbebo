import { defineConfig } from 'vite';

// ملاحظة مهمة: أي سيرفر تشغّله هنا لازم يسمع على 0.0.0.0 ويسمح بأي Host
// عشان المعاينة الحيّة (preview) تشتغل جوه المتصفح.
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    open: false,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
  },
});
