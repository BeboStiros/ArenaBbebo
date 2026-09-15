/* ============================================================
   widgets/attention.js — الانتباه (QKᵀ + Softmax) وتوليد بالاحتمالات
   ============================================================ */

import { $, $$, clamp, esc } from '../core/dom.js';

/* متجهات مبسّطة لكل رمز: التقارب بينها هو اللي بيحدد أوزان الانتباه */
const VECTORS = [
  [0.92, 0.12, 0.1, 0.08],
  [0.18, 0.9, 0.34, 0.12],
  [0.16, 0.86, 0.52, 0.2],
  [0.12, 0.44, 0.9, 0.34],
  [0.1, 0.4, 0.92, 0.5],
  [0.3, 0.28, 0.3, 0.62],
  [0.26, 0.52, 0.44, 0.9],
  [0.86, 0.3, 0.22, 0.2],
];

/* جدول الانتقال: أوزان كل رمز للرمز اللي بعده (إحصاءات صغيرة يدوية) */
const TRANSITIONS = {
  0: { 1: 0.5, 4: 0.2, 5: 0.15, 7: 0.15 },
  1: { 2: 0.55, 0: 0.2, 6: 0.15, 5: 0.1 },
  2: { 0: 0.35, 4: 0.4, 7: 0.15, 5: 0.1 },
  3: { 1: 0.45, 4: 0.25, 7: 0.18, 6: 0.12 },
  4: { 5: 0.65, 7: 0.15, 0: 0.12, 6: 0.08 },
  5: { 6: 0.45, 4: 0.25, 2: 0.15, 0: 0.15 },
  6: { 0: 0.42, 7: 0.4, 4: 0.1, 5: 0.08 },
  7: { 2: 0.4, 0: 0.3, 4: 0.18, 5: 0.12 },
};

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

function softmax(logits, temp = 1) {
  const scaled = logits.map((l) => l / Math.max(0.08, temp));
  const max = Math.max(...scaled);
  const exps = scaled.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function mount(host, { chapter, lang }) {
  const ui = chapter[lang].ui;
  const tokens = ui.tokens;
  const n = tokens.length;

  host.innerHTML = `
    <div class="demo__panel glass glass--spot" style="--accent:${chapter.accent};--accent-2:${chapter.accent2}">
      <div class="demo__row">
        <div>
          <div class="demo__title"><i>${icon()}</i><span>${chapter[lang].demo.title}</span></div>
          <p class="demo__hint">${ui.hint}</p>
        </div>
      </div>

      <div class="seg" role="tablist">
        <button role="tab" aria-selected="true" data-tab="attn">${ui.tabs[0]}</button>
        <button role="tab" aria-selected="false" data-tab="gen">${ui.tabs[1]}</button>
      </div>

      <div class="attn" data-panel="attn">
        <div class="attn__prompt" data-tokens></div>
        <div class="attn__weights">
          <div class="demo__row" style="gap:8px">
            <span class="badge" data-focus></span>
            <span class="badge" data-sum></span>
            <span class="badge" data-sharp></span>
          </div>
          <div data-bars></div>
        </div>
      </div>

      <div class="gen" data-panel="gen" hidden>
        <label class="ctrl">
          <span class="ctrl__label"><span>${ui.temperature}</span><b data-temp-val>0.8</b></span>
          <input type="range" min="0.2" max="1.7" step="0.05" value="0.8" data-temp>
        </label>
        <div class="cand" data-cand></div>
        <div class="gen__out" data-out></div>
        <div class="demo__controls">
          <button class="btn btn--primary btn--sm" data-gen>${ui.generate}</button>
          <button class="btn btn--ghost btn--sm" data-clear>${ui.clear}</button>
        </div>
      </div>
    </div>
  `;

  /* ---------- الانتباه ---------- */
  const tokensEl = $('[data-tokens]', host);
  const barsEl = $('[data-bars]', host);
  tokensEl.innerHTML = tokens
    .map((tok, i) => `<button class="attn__chip" type="button" data-i="${i}">${esc(tok)}</button>`)
    .join('');

  let query = 0;
  let weights = new Array(n).fill(0);

  function compute(queryIndex) {
    const q = VECTORS[queryIndex];
    const logits = VECTORS.map((k) => (dot(q, k) / Math.sqrt(4)) * 3.1);
    return softmax(logits, 1);
  }

  function renderAttention() {
    weights = compute(query);
    const max = Math.max(...weights);
    const sum = weights.reduce((a, b) => a + b, 0);

    $$('.attn__chip', host).forEach((chip, i) => {
      const w = weights[i];
      chip.classList.toggle('is-q', i === query);
      chip.classList.toggle('is-context', i !== query && w > 0.12);
      chip.classList.toggle('is-dim', i !== query && w < 0.06);
      chip.style.opacity = i === query ? '1' : String(clamp(0.35 + w * 2.4, 0.35, 1));
    });

    const order = weights
      .map((w, i) => ({ w, i }))
      .sort((a, b) => b.w - a.w);

    barsEl.innerHTML = order
      .map(
        ({ w, i }) => `
        <div class="wrow ${w === max ? 'is-top' : ''}">
          <span class="wrow__name">${esc(tokens[i])}</span>
          <span class="wrow__bar"><i style="width:${(w * 100).toFixed(1)}%"></i></span>
          <span class="wrow__val">${w.toFixed(3)}</span>
        </div>`
      )
      .join('');

    $('[data-focus]', host).textContent = `${ui.focus}: ${tokens[query]}`;
    $('[data-sum]', host).textContent = `${ui.sum}: ${sum.toFixed(2)}`;
    const second = order[0].i === query ? order[1] : order[0];
    $('[data-sharp]', host).textContent = `${ui.topContext}: ${tokens[second.i]} · ${(max * 100).toFixed(0)}%`;
  }

  tokensEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.attn__chip');
    if (!chip) return;
    query = Number(chip.dataset.i);
    renderAttention();
  });

  /* ---------- التوليد ---------- */
  const outEl = $('[data-out]', host);
  const candEl = $('[data-cand]', host);
  const tempInput = $('[data-temp]', host);
  const tempVal = $('[data-temp-val]', host);
  let temperature = 0.8;
  let cursor = 2; // نبدأ من الفعل: بيتوقّع / predicts
  let generated = [];
  let running = false;

  outEl.dir = lang === 'ar' ? 'rtl' : 'ltr';

  function distribution(from) {
    const table = TRANSITIONS[from % 8] ?? TRANSITIONS[0];
    const idx = Object.keys(table).map(Number);
    const logits = idx.map((i) => Math.log(table[i]));
    const probs = softmax(logits, temperature);
    return idx.map((i, k) => ({ i, p: probs[k] })).sort((a, b) => b.p - a.p);
  }

  function sample(dist) {
    let r = Math.random();
    for (const item of dist) {
      r -= item.p;
      if (r <= 0) return item;
    }
    return dist[0];
  }

  function renderCandidates(dist, picked) {
    candEl.innerHTML = dist
      .slice(0, 4)
      .map(
        (item, k) => `
        <div class="cand__row ${picked && picked.i === item.i ? 'is-pick' : ''}" style="--i:${k}">
          <span class="cand__w">${esc(tokens[item.i])}</span>
          <span class="cand__bar"><i style="width:${(item.p * 100).toFixed(1)}%"></i></span>
          <span class="cand__p">${(item.p * 100).toFixed(1)}%</span>
        </div>`
      )
      .join('');
  }

  function renderOutput() {
    outEl.innerHTML =
      generated.map((t) => esc(tokens[t])).join(' ') +
      (generated.length ? '' : `<span class="ghost">${ui.startHint}</span>`);
  }

  async function step() {
    const dist = distribution(cursor);
    const picked = sample(dist);
    renderCandidates(dist, picked);
    await wait(520);
    generated.push(picked.i);
    cursor = picked.i;
    renderOutput();
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, running ? ms : ms * 0.6));

  async function generate() {
    if (running) return;
    running = true;
    $('[data-gen]', host).disabled = true;
    for (let i = 0; i < 10; i++) {
      await step();
      if (!running) break;
    }
    $('[data-gen]', host).disabled = false;
    running = false;
  }

  $('[data-gen]', host).addEventListener('click', generate);
  $('[data-clear]', host).addEventListener('click', () => {
    generated = [];
    cursor = query;
    renderCandidates(distribution(cursor), null);
    renderOutput();
  });

  tempInput.addEventListener('input', () => {
    temperature = Number(tempInput.value);
    tempVal.textContent = temperature.toFixed(2);
    tempInput.style.setProperty('--fill', `${((temperature - 0.2) / 1.5) * 100}%`);
    renderCandidates(distribution(cursor), null);
  });
  tempInput.dispatchEvent(new Event('input'));

  /* ---------- الشرائح ---------- */
  $$('.seg button', host).forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.seg button', host).forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      $('[data-panel="attn"]', host).hidden = btn.dataset.tab !== 'attn';
      $('[data-panel="gen"]', host).hidden = btn.dataset.tab !== 'gen';
    });
  });

  renderAttention();
  renderCandidates(distribution(cursor), null);
  renderOutput();

  return () => {
    running = false;
  };
}

function icon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 12h4M10 6v12M16 9v6M20 12h-2"/><circle cx="8" cy="12" r="1.6"/><circle cx="14" cy="12" r="1.6"/></svg>`;
}
