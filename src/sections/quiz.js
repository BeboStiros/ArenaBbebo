/* ============================================================
   sections/quiz.js — الاختبار السريع مع نتيجة وتفسير لكل إجابة
   ============================================================ */

import { quiz } from '../data/quiz.js';
import { esc } from '../core/dom.js';
import { state, set } from '../core/state.js';

export function renderQuiz(root, { lang, t }) {
  const qs = quiz[lang];
  const S = t.quiz;

  let index = 0;
  let score = 0;
  let picked = null;
  let finished = false;

  root.className = 'section';
  root.innerHTML = `
    <div class="wrap">
      <div class="sec-head" data-reveal>
        <span class="eyebrow"><i></i>${esc(S.title)}</span>
        <h2 id="quiz-title">${esc(S.title)}</h2>
        <p>${esc(S.lead)}</p>
      </div>

      <div class="demo__panel glass glass--spot" data-reveal style="--accent:var(--violet)">
        <div class="quiz">
          <div class="quiz__head">
            <span class="badge" data-counter></span>
            <div class="quiz__progress"><i data-bar></i></div>
            <span class="badge" data-best></span>
          </div>
          <div data-body></div>
          <p class="scenario__why" data-why hidden></p>
          <div class="demo__controls">
            <button class="btn btn--primary btn--sm" data-next disabled></button>
            <button class="btn btn--ghost btn--sm" data-restart>${esc(S.restart)}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  root.id = 'quiz';
  root.setAttribute('aria-labelledby', 'quiz-title');

  const body = root.querySelector('[data-body]');
  const counter = root.querySelector('[data-counter]');
  const bar = root.querySelector('[data-bar]');
  const bestEl = root.querySelector('[data-best]');
  const why = root.querySelector('[data-why]');
  const nextBtn = root.querySelector('[data-next]');
  const restartBtn = root.querySelector('[data-restart]');

  function showBest() {
    if (state.quizBest == null) {
      bestEl.hidden = true;
      return;
    }
    bestEl.hidden = false;
    bestEl.className = 'badge badge--good';
    bestEl.textContent = `${lang === 'ar' ? 'أفضل نتيجة' : 'Best'}: ${state.quizBest}%`;
  }

  function paint() {
    if (finished) {
      const pct = Math.round((score / qs.length) * 100);
      const band = S.bands.find((b) => pct >= b.min) ?? S.bands[S.bands.length - 1];
      const prevBest = state.quizBest ?? 0;
      if (pct > prevBest) set('quizBest', pct);
      showBest();
      counter.textContent = S.done;
      bar.style.width = '100%';
      why.hidden = true;
      nextBtn.hidden = true;
      body.innerHTML = `
        <div class="quiz__result">
          <div class="quiz__score">${pct}%</div>
          <div class="demo__title" style="justify-content:center"><span>${esc(band.t)}</span></div>
          <p class="muted" style="max-width:52ch;margin-inline:auto">${esc(band.d)}</p>
          <p class="demo__hint">${lang === 'ar' ? 'إجابات صح' : 'Correct'}: ${score} / ${qs.length}</p>
        </div>`;
      restartBtn.textContent = S.again;
      return;
    }

    const q = qs[index];
    counter.textContent = `${S.question} ${index + 1} ${S.of} ${qs.length}`;
    bar.style.width = `${((index + (picked != null ? 1 : 0)) / qs.length) * 100}%`;
    why.hidden = true;
    nextBtn.hidden = false;
    nextBtn.disabled = true;
    nextBtn.textContent = index === qs.length - 1 ? S.showResult : S.next;

    body.innerHTML = `
      <p class="quiz__q">${esc(q.q)}</p>
      <div class="quiz__opts">
        ${q.opts
          .map((o, i) => `<button class="opt" type="button" data-i="${i}">${esc(o)}</button>`)
          .join('')}
      </div>`;
  }

  body.addEventListener('click', (e) => {
    const btn = e.target.closest('.opt');
    if (!btn || picked != null) return;
    const q = qs[index];
    const choice = Number(btn.dataset.i);
    picked = choice;
    const ok = choice === q.correct;
    if (ok) score++;

    body.querySelectorAll('.opt').forEach((node, i) => {
      node.disabled = true;
      if (i === q.correct) node.classList.add('is-good');
      else if (i === choice) node.classList.add('is-bad');
    });

    why.hidden = false;
    why.textContent = `${ok ? S.correct : S.wrong}${q.why}`;
    nextBtn.disabled = false;
    bar.style.width = `${((index + 1) / qs.length) * 100}%`;
  });

  nextBtn.addEventListener('click', () => {
    if (picked == null) return;
    picked = null;
    if (index === qs.length - 1) {
      finished = true;
      paint();
    } else {
      index++;
      paint();
    }
  });

  restartBtn.addEventListener('click', () => {
    index = 0;
    score = 0;
    picked = null;
    finished = false;
    restartBtn.textContent = S.restart;
    paint();
  });

  showBest();
  paint();

  return () => {};
}
