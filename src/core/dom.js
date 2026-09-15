/* ============================================================
   dom.js — أدوات DOM وحسابات صغيرة مشتركة
   ============================================================ */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** ينشئ عنصرًا مع خصائص وأبناء */
export function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

/** يبني HTML من نص مع تهريب القيم غير الموثوقة */
export function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, k) => a + (b - a) * k;
export const rand = (a = 1, b = 0) => b + Math.random() * (a - b);

/** رقم عشوائي بتوزيع طبيعي (Box–Muller) */
export function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const debounce = (fn, ms = 180) => {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
};

/**
 * يتوقف عن العمل لما العنصر يخرج من الشاشة — توفير للمعالج والبطارية
 * cb(true) لما يظهر و cb(false) لما يختفي
 */
export function observeVisibility(node, cb) {
  const io = new IntersectionObserver(
    (entries) => cb(entries[0].isIntersecting),
    { rootMargin: '120px 0px' }
  );
  io.observe(node);
  return () => io.disconnect();
}

/** يحوّل كانفس لدقة الشاشة ويعيد السياق + الأبعاد المنطقية */
export function fitCanvas(canvas, ratio = 1) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round((rect.height || rect.width * ratio) * 1));
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** عدّاد رقمي سلس */
export function countTo(node, target, { dur = 1200, decimals = 0, suffix = '' } = {}) {
  const start = performance.now();
  const from = 0;
  function tick(now) {
    const p = clamp((now - start) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const value = from + (target - from) * eased;
    node.textContent = value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
