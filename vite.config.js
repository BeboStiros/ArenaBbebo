import { defineConfig } from 'vite';

// ملاحظة مهمة: أي سيرفر تشغّله هنا لازم يسمع على 0.0.0.0 ويسمح بأي Host
// عشان المعاينة الحيّة (preview) تشتغل جوه المتصفح.
export default defineConfig(({ command }) => ({
  // عند البناء نستخدم مسارات نسبية عشان الموقع يشتغل من أي مسار
  // (مثلاً https://<user>.github.io/ArenaBbebo/ أو أي استضافة فرعية).
  base: command === 'build' ? './' : '/',
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
}));
