/* ============================================================
   widgets/ethics.js — مواقف أخلاقية واختيارات مع تفسير
   ============================================================ */

import { $, esc } from '../core/dom.js';

export function mount(host, { chapter, lang }) {
  const ui = chapter[lang].ui;
  const scenarios = ui.scenarios;

  host.innerHTML = `
    <div class="demo__panel glass glass--spot" style="--accent:${chapter.accent};--accent-2:${chapter.accent2}">
      <div class="demo__row">
        <div>
          <div class="demo__title"><i>${icon()}</i><span>${chapter[lang].demo.title}</span></div>
          <p class="demo__hint">${ui.hint}</p>
        </div>
        <span class="badge" data-tally></span>
      </div>

      <div class="ethics" style="margin-top:14px">
        <div class="scenario">
          <p class="scenario__q" data-q></p>
          <div class="scenario__opts" data-opts></div>
          <p class="scenario__why" data-why hidden></p>
        </div>
        <div class="demo__controls">
          <button class="btn btn--ghost btn--sm" data-next>${ui.again}</button>
          <span class="badge" data-position></span>
        </div>
      </div>
    </div>
  `;

  const qEl = $('[data-q]', host);
  const optsEl = $('[data-opts]', host);
  const whyEl = $('[data-why]', host);
  const tallyEl = $('[data-tally]', host);
  const posEl = $('[data-position]', host);

  let index = 0;
  let correct = 0;
  let answered = 0;
  let locked = false;

  function render() {
    const s = scenarios[index];
    locked = false;
    qEl.textContent = s.q;
    whyEl.hidden = true;
    whyEl.textContent = '';
    optsEl.innerHTML = s.opts
      .map((o, i) => `<button class="opt" type="button" data-i="${i}">${esc(o.t)}</button>`)
      .join('');
    posEl.textContent = `${index + 1} / ${scenarios.length}`;
  }

  optsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.opt');
    if (!btn || locked) return;
    const s = scenarios[index];
    const chosen = s.opts[Number(btn.dataset.i)];
    locked = true;
    answered++;

    optsEl.querySelectorAll('.opt').forEach((node, i) => {
      const opt = s.opts[i];
      node.disabled = true;
      if (opt.ok) node.classList.add('is-good');
      else if (i === Number(btn.dataset.i)) node.classList.add('is-bad');
    });

    if (chosen.ok) {
      correct++;
      tallyEl.className = 'badge badge--good';
    } else {
      tallyEl.className = 'badge badge--warn';
    }
    tallyEl.textContent = `${ui.tally}: ${correct} / ${answered}`;

    whyEl.hidden = false;
    whyEl.textContent = `${chosen.ok ? (lang === 'ar' ? 'قرار سليم — ' : 'Sound call — ') : lang === 'ar' ? 'مش الأفضل — ' : 'Not ideal — '}${s.why}`;
  });

  $('[data-next]', host).addEventListener('click', () => {
    index = (index + 1) % scenarios.length;
    render();
  });

  render();
  return () => {};
}

function icon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l7 4v5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V7l7-4Z"/><path d="M9.5 12l1.8 1.9 3.4-3.6"/></svg>`;
}
