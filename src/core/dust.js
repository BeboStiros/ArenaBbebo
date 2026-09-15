/* ============================================================
   dust.js — غبار رقمي في الخلفية يتفاعل مع المؤشر
   ============================================================ */

import { fitCanvas, prefersReducedMotion } from './dom.js';

export function initDust(canvas) {
  if (!canvas) return () => {};
  const reduced = prefersReducedMotion();
  let raf = 0;
  let points = [];
  let pointer = { x: -999, y: -999 };
  let w = 0;
  let h = 0;
  let ctx = null;
  let dpr = 1;

  function resize() {
    const fit = fitCanvas(canvas);
    if (!fit) return;
    ctx = fit.ctx;
    w = fit.w;
    h = fit.h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const count = Math.round(Math.min(90, Math.max(34, (w * h) / 24000)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.24,
      vy: (Math.random() - 0.5) * 0.24,
      r: 0.7 + Math.random() * 1.5,
    }));
  }

  function color(mix = 1, alpha = 0.4) {
    const light = document.documentElement.dataset.theme === 'light';
    const c = light ? '80, 96, 178' : '150, 200, 255';
    return `rgba(${c}, ${alpha * mix})`;
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // تفاعل لطيف مع المؤشر
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14000 && d2 > 1) {
        const f = 0.5 / d2;
        p.vx += dx * f;
        p.vy += dy * f;
      }
      p.vx *= 0.992;
      p.vy *= 0.992;
    }

    // خطوط بين النقاط القريبة
    const maxD = w < 720 ? 92 : 128;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < maxD) {
          ctx.strokeStyle = color(1 - d / maxD, 0.22);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of points) {
      ctx.fillStyle = color(1, 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let running = true;

  function loop() {
    if (running && !document.hidden) draw();
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
  });

  resize();
  window.addEventListener('resize', resize);

  const onMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  if (reduced) draw();
  else raf = requestAnimationFrame(loop);

  // يتبع تبديل المظهر
  const mo = new MutationObserver(() => {});
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    mo.disconnect();
  };
}
