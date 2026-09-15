/* ============================================================
   vite.single.config.js — نسخة «ملف واحد» للمعاينة السريعة
   بتبني الموقع في ملف HTML واحد مستقل (كل الخطوط والشيفرة جواه)،
   تقدر تفتحه بدبل كليك من غير سيرفر ولا تثبيت أي حاجة.

   الاستخدام:  npm run build:single   →   standalone/neura.html
   ============================================================ */

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'node:fs';
import path from 'node:path';

/** يحوّل الأيقونة لـ data URI عشان تفضل جوه الملف الواحد */
function inlineFavicon() {
  return {
    name: 'inline-favicon',
    transformIndexHtml(html) {
      try {
        const svg = fs.readFileSync(path.resolve('public/favicon.svg'), 'utf8');
        const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
        return html
          .replace(/(<link rel="icon"[^>]*href=")[^"]*(")/, `$1${dataUri}$2`)
          .replace(/(<link rel="apple-touch-icon"[^>]*href=")[^"]*(")/, `$1${dataUri}$2`);
      } catch {
        return html;
      }
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false, // مفيش ملفات خارجية — كل حاجة جوّه الملف
  plugins: [viteSingleFile({ removeViteModuleLoader: true }), inlineFavicon()],
  build: {
    outDir: 'standalone',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000, // كل الأصول (الخطوط) تتحوّل base64
    target: 'es2020',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 4000,
  },
});
