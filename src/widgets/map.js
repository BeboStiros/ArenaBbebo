/* ============================================================
   widgets/map.js — خريطة تعلّم تفاعلية مع حفظ التقدّم محليًا
   ============================================================ */

import { $, esc } from '../core/dom.js';
import { state, toggleRoadmap, resetRoadmap } from '../core/state.js';
import { showToast } from '../core/toast.js';

export function mount(host, { chapter, lang }) {
  const ui = chapter[lang].ui;
  const phases = ui.phases;

  host.innerHTML = `
    <div class="demo__panel glass glass--spot" style="--accent:${chapter.accent};--accent-2:${chapter.accent2}">
      <div class="demo__row">
        <div>
          <div class="demo__title"><i>${icon()}</i><span>${chapter[lang].demo.title}</span></div>
          <p class="demo__hint">${ui.hint}</p>
        </div>
        <span class="badge" data-progress></span>
      </div>

      <div class="map" style="margin-top:14px">
        <div class="map__bar"><i data-bar></i></div>
        <div class="map__track" data-track></div>
        <div class="demo__controls">
          <button class="chip-btn" data-clear>${ui.resetAll}</button>
        </div>
      </div>
    </div>
  `;

  const track = $('[data-track]', host);
  const bar = $('[data-bar]', host);
  const progress = $('[data-progress]', host);

  track.innerHTML = phases
    .map(
      (p, i) => `
      <article class="map__item" data-i="${i}" role="button" tabindex="0" aria-pressed="false">
        <div class="map__when">${esc(p.when)}</div>
        <div>
          <div class="map__title">${esc(p.title)} <span class="badge badge--good" data-done hidden>${ui.done} ✓</span></div>
          <p class="map__desc">${esc(p.desc)}</p>
          <div class="map__tools" style="margin-top:9px">
            ${p.tools.map((tool) => `<span class="tag">${esc(tool)}</span>`).join('')}
          </div>
        </div>
      </article>`
    )
    .join('');

  function sync() {
    const done = new Set(state.roadmap);
    track.querySelectorAll('.map__item').forEach((item, i) => {
      const isDone = done.has(i);
      item.classList.toggle('is-done', isDone);
      item.setAttribute('aria-pressed', String(isDone));
      const badge = item.querySelector('[data-done]');
      if (badge) badge.hidden = !isDone;
    });
    const pct = Math.round((done.size / phases.length) * 100);
    bar.style.width = `${pct}%`;
    progress.textContent = `${ui.progress}: ${pct}%`;
    progress.className = `badge ${pct >= 100 ? 'badge--good' : pct > 0 ? '' : 'badge--warn'}`;
  }

  function toggle(item) {
    const i = Number(item.dataset.i);
    toggleRoadmap(i);
    sync();
  }

  track.addEventListener('click', (e) => {
    const item = e.target.closest('.map__item');
    if (item) toggle(item);
  });
  track.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.map__item');
    if (!item) return;
    e.preventDefault();
    toggle(item);
  });

  $('[data-clear]', host).addEventListener('click', () => {
    resetRoadmap();
    sync();
    showToast(lang === 'ar' ? 'تم مسح التقدّم' : 'Progress cleared');
  });

  sync();
  return () => {};
}

function icon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19V5l7 3 9-3v14l-9 3-7-3Z"/><path d="M11 8v11"/></svg>`;
}
