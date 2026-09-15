/* ============================================================
   sections/hero.js — الواجهة الأولى
   ============================================================ */

import { site } from '../data/site.js';
import { chapters } from '../data/chapters.js';
import { esc } from '../core/dom.js';

export function renderHero(root, { lang, t }) {
  const h = site.hero[lang];
  const num = (n) => n.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');

  root.innerHTML = `
    <div class="wrap">
      <div class="hero__grid">
        <div class="hero__copy">
          <span class="eyebrow" data-reveal><i></i>${esc(h.eyebrow)}</span>
          <h1 class="hero__title" id="hero-title" data-reveal>
            ${esc(h.titleTop)}<br />
            <span class="gradient-text">${esc(h.titleGrad)}</span><br />
            ${esc(h.titleBottom)}
          </h1>
          <p class="hero__lead" data-reveal>${esc(h.lead)}</p>
          <div class="hero__cta" data-reveal>
            <button class="btn btn--primary" type="button" data-go="neural">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              ${esc(h.ctaPrimary)}
            </button>
            <button class="btn btn--ghost" type="button" data-go="chapters">${esc(h.ctaSecondary)}</button>
          </div>
        </div>

        <div class="hero__stage" data-reveal>
          <div class="orb-card glass glass--aura">
            <canvas id="orb" aria-hidden="true"></canvas>
            <p class="orb-hint">${esc(h.orbHint)}</p>
          </div>
          <div class="chips" aria-hidden="true">
            ${h.chips
              .map(
                (c, i) => `<span class="chip chip--${i + 1}"><i></i>${esc(c.k)} <b>${esc(c.v)}</b></span>`
              )
              .join('')}
          </div>
        </div>
      </div>

      <div class="marquee-stats" data-reveal>
        ${h.stats
          .map(
            (s) => `
          <div class="count-card glass glass--spot">
            <b data-count="${s.n}" data-prefix="${esc(s.prefix ?? '')}" data-suffix="${esc(s.suffix ?? '')}">0</b>
            <span>${esc(s.s)}</span>
          </div>`
          )
          .join('')}
      </div>

      <div class="ticker" data-reveal aria-hidden="true">
        <div class="ticker__track">
          ${[0, 1]
            .map(
              (k) => `<div class="ticker__group">
              ${chapters
                .map(
                  (c) => `<span class="ticker__item">
                    <i style="background:${c.accent}"></i>${esc(c[lang].nav)}
                  </span>`
                )
                .join('')}
            </div>`
            )
            .join('')}
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.go === 'chapters' ? 'chapters' : btn.dataset.go;
      const node = document.getElementById(id);
      if (!node) return;
      const top = node.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // عدّادات الإحصاءات
  const counters = root.querySelectorAll('[data-count]');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const node = entry.target;
        const target = Number(node.dataset.count);
        const prefix = node.dataset.prefix;
        const suffix = node.dataset.suffix;
        const start = performance.now();
        const dur = 1100;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - (1 - p) ** 3;
          node.textContent = prefix + num(Math.round(target * eased)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(node);
      }
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => io.observe(c));

  void t;
  return { orb: root.querySelector('#orb') };
}
