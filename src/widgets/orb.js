/* ============================================================
   widgets/orb.js — سبيكة الهيرو: شبكة عصبية إشعاعية بإشارات متحركة
   ============================================================ */

import { clamp, observeVisibility, prefersReducedMotion } from '../core/dom.js';

const LAYERS = [4, 8, 8, 4];
const RADII = [0.2, 0.4, 0.62, 0.86];
const COLORS = ['#a78bfa', '#22d3ee', '#34d399', '#f472b6'];

export function initOrb(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const reduced = prefersReducedMotion();
  let w = 320;
  let h = 320;
  let dpr = 1;
  let rotation = -0.5;
  let dragging = false;
  let lastX = 0;
  let velocity = 0;
  let pulses = [];
  let flashes = [];
  let hover = null;
  let pointer = { x: -999, y: -999 };
  let raf = 0;
  let t0 = performance.now();

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = Math.max(200, Math.round(rect.width));
    h = Math.max(200, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function nodes() {
    const cx = w / 2;
    const cy = h / 2;
    const unit = Math.min(w, h) / 2;
    return LAYERS.map((count, li) => {
      const r = RADII[li] * unit;
      const offset = rotation + li * 0.26;
      return Array.from({ length: count }, (_, i) => {
        const a = offset + (i / count) * Math.PI * 2;
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, li, i, a, r };
      });
    });
  }

  function connections(rings) {
    const edges = [];
    for (let li = 0; li < rings.length - 1; li++) {
      const from = rings[li];
      const to = rings[li + 1];
      from.forEach((a, i) => {
        const center = Math.round((i * to.length) / from.length);
        for (const offset of [-1, 0, 1]) {
          const j = (center + offset + to.length) % to.length;
          edges.push({ a, b: to[j], li });
        }
      });
    }
    return edges;
  }

  function spawn(edges) {
    const inputs = edges.filter((e) => e.li === 0);
    if (!inputs.length) return;
    const edge = inputs[Math.floor(Math.random() * inputs.length)];
    pulses.push({ a: edge.a, b: edge.b, t: 0, speed: 0.012 + Math.random() * 0.01, color: COLORS[0], gen: 0 });
  }

  function step(dt) {
    if (!dragging) {
      velocity *= 0.94;
      rotation += (0.06 + velocity) * dt;
    }
    rotation += velocity * dt * 6;

    const rings = nodes();
    const edges = connections(rings);

    // تحديث النبضات
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += p.speed * dt * 60;
      if (p.t >= 1) {
        flashes.push({ x: p.b.x, y: p.b.y, life: 1, color: COLORS[Math.min(p.gen + 1, 3)] });
        pulses.splice(i, 1);
        if (p.gen < 2) {
          const nexts = edges.filter((e) => e.li === p.gen + 1 && e.a === p.b);
          const picks = nexts.sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.5 ? 1 : 2);
          picks.forEach((e, k) =>
            pulses.push({
              a: e.a,
              b: e.b,
              t: 0,
              speed: 0.013 + Math.random() * 0.01,
              color: COLORS[Math.min(p.gen + 1, 3)],
              gen: p.gen + 1 + 0 * k,
            })
          );
        } else {
          pulses.push({
            a: p.b,
            b: p.b,
            t: 0,
            speed: 0.03,
            color: COLORS[3],
            gen: 4,
            die: true,
          });
        }
      }
    }
    // نبضات الموت (توهّج عند الخروج)
    pulses = pulses.filter((p) => !(p.die && p.t >= 1));

    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].life -= 0.02 * dt * 60;
      if (flashes[i].life <= 0) flashes.splice(i, 1);
    }

    if (Math.random() < 0.05) spawn(edges);

    draw(rings, edges);
  }

  function draw(rings, edges) {
    const light = document.documentElement.dataset.theme === 'light';
    ctx.clearRect(0, 0, w, h);

    // توهّج مركزي
    const cx = w / 2;
    const cy = h / 2;
    const pulse = 0.5 + 0.5 * Math.sin((performance.now() - t0) / 1400);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55);
    glow.addColorStop(0, `rgba(139, 92, 246, ${light ? 0.16 : 0.3 * (0.7 + pulse * 0.3)})`);
    glow.addColorStop(0.5, 'rgba(34, 211, 238, 0.07)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // حلقات إرشادية
    ctx.strokeStyle = light ? 'rgba(19,26,58,.08)' : 'rgba(255,255,255,.07)';
    ctx.lineWidth = 1;
    RADII.forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (Math.min(w, h) / 2), 0, Math.PI * 2);
      ctx.stroke();
    });

    // الوصلات
    for (const e of edges) {
      const active = pulses.some((p) => p.a === e.a && p.b === e.b);
      ctx.strokeStyle = light
        ? `rgba(70, 90, 160, ${active ? 0.4 : 0.14})`
        : `rgba(150, 190, 255, ${active ? 0.5 : 0.13})`;
      ctx.lineWidth = active ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    }

    // النبضات
    for (const p of pulses) {
      if (p.a === p.b) continue;
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 9);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // الومضات
    for (const f of flashes) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, (1 - f.life) * 20 + 4, 0, Math.PI * 2);
      ctx.strokeStyle = f.color + Math.round(f.life * 150).toString(16).padStart(2, '0');
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // العُقد
    rings.forEach((ring, li) => {
      const color = COLORS[li];
      ring.forEach((n) => {
        const near = Math.hypot(pointer.x - n.x, pointer.y - n.y) < 28;
        if (near) hover = n;
        const base = li === 0 ? 5 : li === 3 ? 6.5 : 5.5;
        const size = base + (near ? 3.4 : 0);

        ctx.beginPath();
        ctx.arc(n.x, n.y, size + 4, 0, Math.PI * 2);
        ctx.fillStyle = color + (near ? '3a' : '1f');
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fillStyle = light ? '#ffffff' : '#070b16';
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = color;
        ctx.stroke();

        if (near) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });
  }

  /* ---------- التفاعل ---------- */
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (dragging) {
      velocity = (e.clientX - lastX) * 0.0022;
      lastX = e.clientX;
    }
  });
  const stop = () => {
    dragging = false;
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('pointerleave', () => {
    pointer = { x: -999, y: -999 };
  });
  canvas.style.cursor = 'grab';

  /* ---------- الحلقة ---------- */
  let prev = performance.now();
  let onScreen = true;
  function loop(now) {
    const dt = clamp((now - prev) / 1000, 0.001, 0.05);
    prev = now;
    if (onScreen) step(dt);
    raf = requestAnimationFrame(loop);
  }

  fit();
  if (reduced) {
    draw(nodes(), connections(nodes()));
  } else {
    raf = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(() => {
    fit();
    if (reduced) draw(nodes(), connections(nodes()));
  });
  ro.observe(canvas);
  const stopVisible = observeVisibility(canvas, (visible) => {
    onScreen = visible;
  });

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    stopVisible();
    hover = null;
  };
}
