/* ============================================================
   widgets/code.js — بطاقات مقارنة اللغات + محرر صغير يشغّل كود حقيقي
   ============================================================ */

import { $, $$, clamp, esc } from '../core/dom.js';
import { showToast } from '../core/toast.js';

const DEFAULT_BODY = `
function grade(score, bonus = 0) {
  const total = Math.max(0, Math.min(100, score + bonus));

  if (total >= 90) return total + " → A";
  if (total >= 80) return total + " → B";
  if (total >= 70) return total + " → C";
  if (total >= 60) return total + " → D";
  return total + " → F";
}
`.trim();

export function mount(host, { chapter, lang, t }) {
  const ui = chapter[lang].ui;
  const codeStrings = ui.code;

  host.innerHTML = `
    <div class="demo" style="--accent:${chapter.accent};--accent-2:${chapter.accent2}">
      <div class="demo__panel glass glass--spot" style="--accent:${chapter.accent};--accent-2:${chapter.accent2}">
        <div class="demo__title"><i>${icon('lang')}</i><span>${ui.langs.title}</span></div>
        <p class="demo__hint">${ui.langs.subtitle}</p>
        <div class="lang-grid" data-langs style="margin-top:14px"></div>
      </div>

      <div class="demo__panel glass glass--spot" style="--accent:${chapter.accent};--accent-2:${chapter.accent2}">
        <div class="demo__row">
          <div>
            <div class="demo__title"><i>${icon('code')}</i><span>${codeStrings.title}</span></div>
            <p class="demo__hint">${ui.hint}</p>
          </div>
        </div>

        <div class="code" style="margin-top:14px">
          <div class="code__bar">
            <span class="code__dots"><i></i><i></i><i></i></span>
            <span class="code__file">${codeStrings.file}</span>
            <span class="code__lang">JavaScript</span>
          </div>
          <pre data-view><code data-code></code></pre>
          <textarea data-edit dir="ltr" spellcheck="false" hidden
            style="width:100%;min-height:230px;border:0;background:transparent;color:#e6ecff;font-family:var(--font-mono);font-size:.85rem;line-height:1.7;padding:16px 18px;resize:vertical"></textarea>

          <div class="code__note">
            <div>${codeStrings.note}</div>
            <div class="code__vars">
              <label>${codeStrings.inputLabel}<input type="number" value="86" min="0" max="100" step="1" data-score></label>
              <label>${codeStrings.bonusLabel}<input type="number" value="5" min="0" max="50" step="1" data-bonus></label>
            </div>
            <div class="code__out" data-out dir="ltr"></div>
            <div class="demo__controls">
              <button class="btn btn--primary btn--sm" data-run>${t.run}</button>
              <button class="btn btn--ghost btn--sm" data-mode>${ui.edit}</button>
              <button class="btn btn--ghost btn--sm" data-copy>${ui.copy}</button>
              <button class="btn btn--ghost btn--sm" data-restore>${ui.restore}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  /* ---------- بطاقات اللغات ---------- */
  const langsEl = $('[data-langs]', host);
  langsEl.innerHTML = ui.langs.cards
    .map(
      (c) => `
      <article class="lang-card" style="--c:${c.color}">
        <div class="lang-card__top">
          <span class="lang-card__dot"></span>
          <h4>${esc(c.name)}</h4>
        </div>
        <p class="lang-card__desc">${esc(c.desc)}</p>
        <div class="lang-card__tags">${c.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        <p class="lang-card__use"><b>${t.tryIt}:</b> ${esc(c.use)}</p>
      </article>`
    )
    .join('');

  /* ---------- الكود ---------- */
  const codeEl = $('[data-code]', host);
  const preEl = $('[data-view]', host);
  const editor = $('[data-edit]', host);
  const outEl = $('[data-out]', host);
  const scoreEl = $('[data-score]', host);
  const bonusEl = $('[data-bonus]', host);
  const modeBtn = $('[data-mode]', host);

  const comment = lang === 'ar' ? '// دالة بتحوّل الدرجة لحرف — غيّر الأرقام وشوف' : '// turns a score into a letter grade — edit the numbers';
  const source = `${comment}\n${DEFAULT_BODY}`;
  let code = source;

  codeEl.innerHTML = highlight(code);

  function run() {
    const score = Number(scoreEl.value) || 0;
    const bonus = Number(bonusEl.value) || 0;
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('score', 'bonus', `${code}\nreturn grade(score, bonus);`);
      const result = fn(score, bonus);
      outEl.textContent = `${codeStrings.outputLabel}: ${result}`;
      outEl.style.borderColor = 'rgba(52,211,153,.3)';
      outEl.style.background = 'rgba(52,211,153,.12)';
      outEl.style.color = '#b6f5d8';
    } catch (error) {
      outEl.textContent = `⚠︎ ${error.message}`;
      outEl.style.borderColor = 'rgba(251,113,133,.35)';
      outEl.style.background = 'rgba(251,113,133,.12)';
      outEl.style.color = '#ffc9d3';
    }
  }

  $('[data-run]', host).addEventListener('click', run);
  scoreEl.addEventListener('input', run);
  bonusEl.addEventListener('input', run);

  modeBtn.addEventListener('click', () => {
    const editing = editor.hidden;
    editor.hidden = !editing;
    preEl.hidden = editing;
    modeBtn.textContent = editing ? ui.preview : ui.edit;
    if (editing) {
      editor.value = code;
      editor.focus();
    }
  });

  let timer = 0;
  editor.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      code = editor.value;
      codeEl.innerHTML = highlight(code);
      run();
    }, 220);
  });

  $('[data-restore]', host).addEventListener('click', () => {
    code = source;
    editor.value = code;
    codeEl.innerHTML = highlight(code);
    run();
    showToast(lang === 'ar' ? 'تم استرجاع الشيفرة الأصلية' : 'Original code restored');
  });

  $('[data-copy]', host).addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(t.copied, 'good');
    } catch {
      showToast(t.copyFail, 'bad');
    }
  });

  run();

  return () => clearTimeout(timer);
}

/* ---------- تلوين بسيط للشيفرة ---------- */
const PATTERN =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:function|const|let|var|return|if|else|for|while|of|in|new|try|catch|class|extends|typeof|true|false|null|undefined|Math)\b)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|(&lt;|&gt;|[=+\-*/<>!&|?:]+)/g;

function highlight(source) {
  return esc(source).replace(PATTERN, (match, comment, str, keyword, num, fn, op) => {
    if (comment) return `<span class="tk-c">${comment}</span>`;
    if (str) return `<span class="tk-s">${str}</span>`;
    if (keyword) return `<span class="tk-k">${keyword}</span>`;
    if (num) return `<span class="tk-n">${num}</span>`;
    if (fn) return `<span class="tk-f">${fn}</span>`;
    if (op) return `<span class="tk-o">${op}</span>`;
    return match;
  });
}

function icon(kind) {
  if (kind === 'lang')
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 4h6v16H9zM4 8h3M4 12h3M4 16h3M17 8h3M17 12h3M17 16h3"/></svg>`;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 6 3 12l5 6M16 6l5 6-5 6"/></svg>`;
}
