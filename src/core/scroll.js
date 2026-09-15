/* ============================================================
   scroll.js — الظهور التدريجي، مؤشر التقدم، الهيدر، مؤشر الفهرس
   ============================================================ */

import { $, $$, clamp, prefersReducedMotion } from './dom.js';

let revealCleanup = null;

/**
 * يظهر العناصر تدريجيًا عند وصولها للشاشة.
 * بنستخدم IntersectionObserver + فحص يدوي عند التمرير، عشان مانضيّعش
 * أي عنصر لما المستخدم يقفز لموضع جديد فجأة (روابط داخلية / تبديل لغة).
 */
export function initReveal(root = document) {
  revealCleanup?.();

  const items = $$('[data-reveal]', root);
  if (!items.length) return;

  if (prefersReducedMotion()) {
    items.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  let pending = new Set(items);
  let lastRun = 0;

  // الفحص مباشر ومتزامن (بدون rAF) عشان مايعتمدش على إطار رسم —
  // مهم لو المستخدم قافز لموضع جديد فجأة أو التاب كان في الخلفية.
  const flush = (force = false) => {
    if (!pending.size) return;
    const now = performance.now();
    if (!force && now - lastRun < 80) return;
    lastRun = now;
    const h = window.innerHeight || document.documentElement.clientHeight;
    for (const node of [...pending]) {
      const rect = node.getBoundingClientRect();
      if (rect.top < h * 0.94 && rect.bottom > -40) {
        node.classList.add('is-visible');
        pending.delete(node);
      }
    }
    if (!pending.size) detach();
  };

  const schedule = () => flush();

  const io = new IntersectionObserver(schedule, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  const detach = () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    io.disconnect();
  };

  items.forEach((node) => io.observe(node));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  flush(true);

  revealCleanup = detach;
}

/** تدرّج فهرس الظهور داخل عنصر */
export function stagger(root = document) {
  $$('[data-reveal]', root).forEach((node, i) => node.style.setProperty('--d', String(i % 6)));
}

/** يضبط الهيدر وشريط التقدم وزر العودة للأعلى */
export function initScrollChrome({ onProgress } = {}) {
  const topbar = $('#topbar');
  const fill = $('#progressFill');
  const toTop = $('#toTop');
  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const p = clamp(y / max, 0, 1);

    if (fill) fill.style.setProperty('--p', `${(p * 100).toFixed(2)}%`);
    if (topbar) topbar.classList.toggle('is-stuck', y > 18);
    if (toTop) {
      const show = y > window.innerHeight * 1.1;
      toTop.hidden = !show;
      toTop.style.opacity = show ? '1' : '0';
    }
    onProgress?.(p, y);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));
}

/** يتابع أي قسم ظاهر الآن ويبلّغ عنه */
export function initScrollSpy(ids, cb) {
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  const visible = new Map();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      let best = null;
      let bestRatio = 0;
      for (const [id, ratio] of visible) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = id;
        }
      }
      if (best) cb(best);
    },
    { threshold: [0.06, 0.25, 0.5, 0.75], rootMargin: '-18% 0px -46% 0px' }
  );
  sections.forEach((s) => io.observe(s));
}

/** انتقال سلس إلى قسم مع مراعاة الهيدر */
export function scrollToId(id) {
  const node = document.getElementById(id);
  if (!node) return;
  const top = node.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
