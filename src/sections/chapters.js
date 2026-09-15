/* ============================================================
   sections/chapters.js — بناء الفصول + تركيب التجارب التفاعلية
   ============================================================ */

import { chapters } from '../data/chapters.js';
import { esc } from '../core/dom.js';
import { WIDGETS } from '../widgets/index.js';

function renderBlocks(blocks) {
  return blocks
    .map((b) => {
      switch (b.t) {
        case 'h3':
          return `<h3>${b.v}</h3>`;
        case 'p':
          return `<p>${b.v}</p>`;
        case 'bullets':
          return `<ul class="bullets">${b.v.map((i) => `<li>${i}</li>`).join('')}</ul>`;
        case 'steps':
          return `<ol class="steps">${b.v
            .map(
              (s) => `<li class="step"><span class="step__num"></span>
                <span class="step__body"><b>${s.b}</b><p>${s.d}</p></span></li>`
            )
            .join('')}</ol>`;
        case 'card':
          return `<aside class="lead-card glass lead-card--${b.kind === 'warn' ? 'warn' : 'tip'}">
              <div class="lead-card__title">${b.kind === 'warn' ? warnIcon() : tipIcon()}${b.title}</div>
              <p>${b.text}</p>
            </aside>`;
        default:
          return '';
      }
    })
    .join('');
}

const tipIcon = () =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--cyan)"><path d="M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3Z"/><path d="M9.5 20h5"/></svg>`;
const warnIcon = () =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--amber)"><path d="M12 4l9 16H3l9-16Z"/><path d="M12 10v4M12 17h.01"/></svg>`;

export function renderChapters(root, { lang, t }) {
  const controllers = [];

  root.innerHTML = `
    <section class="section" id="chapters-intro" aria-labelledby="chapters-title">
      <div class="wrap">
        <div class="sec-head" data-reveal>
          <span class="eyebrow"><i></i>${esc(t.chaptersNav)}</span>
          <h2 id="chapters-title">${esc(t.chaptersTitle)}</h2>
          <p>${esc(t.chaptersLead)}</p>
        </div>
      </div>
    </section>
    ${chapters
      .map((c, i) => {
        const data = c[lang];
        return `
      <article class="chapter" id="${c.id}" style="--accent:${c.accent};--accent-2:${c.accent2}">
        <div class="wrap">
          <header class="chapter__head" data-reveal>
            <span class="chapter__num">${c.num} · ${esc(data.kicker)}</span>
            <h2>${esc(data.title)}</h2>
            <p class="chapter__lead">${esc(data.lead)}</p>
            <div class="chapter__meta">
              ${data.meta.map((m) => `<span>${dot(c.accent)}${esc(m)}</span>`).join('')}
            </div>
          </header>

          <div class="chapter__grid ${i % 2 === 1 ? 'chapter__grid--flip' : ''}">
            <div class="prose" data-reveal>
              ${renderBlocks(data.body)}
            </div>
            <div class="chapter__demo" data-reveal>
              <div class="demo" data-widget="${c.widget}"></div>
            </div>
          </div>
        </div>
      </article>`;
      })
      .join('')}
  `;

  // تركيب التجارب التفاعلية
  root.querySelectorAll('[data-widget]').forEach((host) => {
    const name = host.dataset.widget;
    const chapter = chapters.find((c) => c.widget === name);
    const mountFn = WIDGETS[name];
    if (!chapter || !mountFn) return;
    try {
      const cleanup = mountFn(host, { chapter, lang, t });
      if (typeof cleanup === 'function') controllers.push(cleanup);
    } catch (error) {
      host.innerHTML = `<div class="demo__panel glass"><p class="demo__hint">⚠︎ ${esc(error.message)}</p></div>`;
      console.error(`[widget:${name}]`, error);
    }
  });

  return () => controllers.forEach((fn) => fn?.());
}

const dot = (color) => `<i style="width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 10px ${color}"></i>`;
