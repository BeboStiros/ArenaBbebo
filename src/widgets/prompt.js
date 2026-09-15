/* ============================================================
   widgets/prompt.js — مقياس جودة الأمر (تحليل لحظي محلي)
   ============================================================ */

import { $, clamp, esc } from '../core/dom.js';
import { showToast } from '../core/toast.js';

const CIRC = 2 * Math.PI * 42;

const RULES = [
  // الدور
  /(انت\s|أنت\s|كون|تخيّل|تخيل|تصرف|اعمل\s+ك|بصفتك|you are|act as|as an?|imagine you|pretend|you're a)/i,
  // السياق
  /(للمرحلة|لمرحلة|طالب|مبتدئ|خبير|سياق|جمهور|لأطفال|لعمر|في شركة|عميل|context|audience|beginner|expert|for a|my team|students)/i,
  // شكل المخرجات
  /(نقاط|جدول|قائمة|كلمة|كلمات|فقرات|خطوات|شكل|صيغة|عنوان|ملخص|bullet|table|list|words|paragraph|steps|format|summar)/i,
  // الطول
  null,
  // الأسلوب
  /(بأسلوب|نبرة|ودي|رسمي|أكاديمي|بسيط|مرح|واضح|مباشر|tone|style|friendly|formal|casual|simple|clear)/i,
  // القيود
  /(تجنب|بدون|لا تستخدم|اعتمد|مصادر|قيود|مهم جدا|ضروري|avoid|do not|don't|only|must|constraint|sources|citation)/i,
];

const ROLE_LINE = {
  ar: 'أنت خبير في المجال ده وبتشرح للمبتدئين.',
  en: 'You are an expert in this field explaining to beginners.',
};
const CONTEXT_LINE = {
  ar: 'السياق: المستوى مبتدئ، ومحتاج شرح مبسّط بمثال من الواقع.',
  en: 'Context: the audience is a beginner who needs a simple explanation with a real example.',
};
const SHAPE_LINE = {
  ar: 'شكل المخرجات: ٥ نقاط مختصرة، ثم مثال عملي واحد في النهاية.',
  en: 'Output shape: five short bullets, then one practical example at the end.',
};
const TONE_LINE = {
  ar: 'الأسلوب: واضح وودي، وبدون مصطلحات معقدة أو حشو.',
  en: 'Tone: clear and friendly, without jargon or filler.',
};
const LIMIT_LINE = {
  ar: 'قيود: اعتمد على معلومات متفق عليها، ولو معلومة غير مؤكدة قلها صريح.',
  en: 'Constraints: rely on well-established facts, and flag anything uncertain.',
};

export function mount(host, { chapter, lang, t }) {
  const ui = chapter[lang].ui;

  host.innerHTML = `
    <div class="demo__panel glass glass--spot" style="--accent:${chapter.accent};--accent-2:${chapter.accent2}">
      <div class="demo__row">
        <div>
          <div class="demo__title"><i>${icon()}</i><span>${chapter[lang].demo.title}</span></div>
          <p class="demo__hint">${ui.hint}</p>
        </div>
        <span class="badge" data-verdict></span>
      </div>

      <div class="prompt" style="margin-top:14px">
        <div class="prompt__field">
          <textarea data-input placeholder="${esc(ui.placeholder)}" spellcheck="false"></textarea>
          <div class="tok__presets" data-examples></div>
        </div>

        <div class="prompt__score">
          <div class="score-ring">
            <div class="ring">
              <svg viewBox="0 0 100 100" width="96" height="96" aria-hidden="true">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#a78bfa" />
                    <stop offset=".5" stop-color="#22d3ee" />
                    <stop offset="1" stop-color="#34d399" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,.22)" stroke-width="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#ringGrad)" stroke-width="8"
                  stroke-linecap="round" stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${CIRC.toFixed(1)}" data-ring />
              </svg>
              <div class="ring__val"><span data-score>0</span><small>${ui.outOf}</small></div>
            </div>
            <div class="checks" data-checks></div>
          </div>
        </div>

        <div class="prompt__fixed">
          <div class="demo__controls">
            <button class="btn btn--primary btn--sm" data-rewrite>${ui.rewrite}</button>
            <button class="btn btn--ghost btn--sm" data-copy>${t.copy}</button>
          </div>
          <div class="code__out" data-fixed hidden></div>
        </div>
      </div>
    </div>
  `;

  const input = $('[data-input]', host);
  const ring = $('[data-ring]', host);
  const scoreEl = $('[data-score]', host);
  const checksEl = $('[data-checks]', host);
  const verdict = $('[data-verdict]', host);
  const fixedEl = $('[data-fixed]', host);

  checksEl.innerHTML = ui.checks
    .map(
      (label, i) => `
      <div class="check" data-c="${i}">
        <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M5 13l4 4L19 7"/></svg></i>
        <span>${esc(label)}</span>
      </div>`
    )
    .join('');

  const examplesEl = $('[data-examples]', host);
  examplesEl.innerHTML = ui.examples.map((ex) => `<button class="chip-btn" type="button">${esc(ex)}</button>`).join('');
  examplesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    input.value = btn.textContent;
    evaluate();
  });

  /* ---------- التحليل ---------- */
  function analyze(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const results = RULES.map((rule, i) => {
      if (i === 3) return words.length >= 12; // الطول
      return rule ? rule.test(text) : false;
    });
    return results;
  }

  function evaluate() {
    const text = input.value;
    const results = analyze(text);
    const score = results.filter(Boolean).length;

    checksEl.querySelectorAll('.check').forEach((node, i) => node.classList.toggle('is-on', results[i]));

    const offset = CIRC * (1 - score / RULES.length);
    ring.style.transition = 'stroke-dashoffset .55s cubic-bezier(.16,1,.3,1)';
    ring.setAttribute('stroke-dashoffset', offset.toFixed(1));
    scoreEl.textContent = String(score);

    const ratio = score / RULES.length;
    verdict.className = `badge ${ratio >= 0.84 ? 'badge--good' : ratio >= 0.5 ? '' : 'badge--warn'}`;
    verdict.textContent =
      ratio >= 0.84
        ? lang === 'ar'
          ? 'أمر ممتاز 👌'
          : 'Excellent prompt 👌'
        : ratio >= 0.5
          ? lang === 'ar'
            ? 'قابل للتحسين'
            : 'Can improve'
          : lang === 'ar'
            ? 'أمر مبهم'
            : 'Too vague';

    if (!fixedEl.hidden) fixedEl.hidden = true;
    return { score, results, text };
  }

  /* ---------- الصياغة المحسّنة ---------- */
  function rewrite() {
    const { results, text } = evaluate();
    const lines = [];
    if (!results[0]) lines.push(ROLE_LINE[lang]);
    lines.push(lang === 'ar' ? `المهمة: ${text.trim() || '…'}` : `Task: ${text.trim() || '…'}`);
    if (!results[1]) lines.push(CONTEXT_LINE[lang]);
    if (!results[2]) lines.push(SHAPE_LINE[lang]);
    if (!results[4]) lines.push(TONE_LINE[lang]);
    if (!results[5]) lines.push(LIMIT_LINE[lang]);
    fixedEl.hidden = false;
    fixedEl.innerHTML = `<b style="color:#fff">${esc(ui.fixedTitle)}</b><br><br>${esc(lines.join('\n\n'))}`;
    fixedEl.style.whiteSpace = 'pre-wrap';
    fixedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  $('[data-rewrite]', host).addEventListener('click', rewrite);
  $('[data-copy]', host).addEventListener('click', async () => {
    const text = fixedEl.hidden ? input.value : fixedEl.textContent;
    try {
      await navigator.clipboard.writeText(text);
      showToast(t.copied, 'good');
    } catch {
      showToast(t.copyFail, 'bad');
    }
  });

  input.addEventListener('input', evaluate);

  input.value = ui.examples[0] ?? '';
  evaluate();

  return () => {};
}

function icon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6h16M4 12h10M4 18h7"/><path d="M17 13l3 3-3 3"/></svg>`;
}
