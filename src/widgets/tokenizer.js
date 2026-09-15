/* ============================================================
   widgets/tokenizer.js — محاكي تقطيع النص (تقريب لـ BPE) حقيقي
   يشتغل على العربي والإنجليزي، ويعرض رقم كل قطعة
   ============================================================ */

import { $, clamp, esc } from '../core/dom.js';

const PALETTE = ['#8b5cf6', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a3e635', '#fb7185'];

/* بادئات ولواحق عربية شائعة — بتخلي التقطيع يشبه اللي المحلّلات الحقيقية بتعمله */
const AR_PREFIXES = ['وال', 'بال', 'كال', 'فال', 'ال', 'و', 'ف', 'ب', 'ك', 'ل', 'س'];
const AR_SUFFIXES = ['اتها', 'اتهم', 'اتنا', 'يات', 'ات', 'ون', 'ين', 'ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'ية', 'ه', 'ي'];

const isArabicWord = (word) => /[\u0600-\u06FF\u0750-\u077F]/.test(word);
const totalPieces = (words) => words.reduce((sum, word) => sum + word.length, 0);

function splitArabic(word) {
  const out = [];
  let rest = word;
  for (const prefix of AR_PREFIXES) {
    if (rest.length > prefix.length + 1 && rest.startsWith(prefix)) {
      out.push(prefix);
      rest = rest.slice(prefix.length);
      break;
    }
  }
  let suffix = '';
  for (const item of AR_SUFFIXES) {
    if (rest.length > item.length + 1 && rest.endsWith(item)) {
      suffix = item;
      rest = rest.slice(0, -item.length);
      break;
    }
  }
  const pieces = [];
  for (let i = 0; i < rest.length; i += 4) pieces.push(rest.slice(i, i + 4));
  return [...out, ...pieces, suffix].filter(Boolean);
}

/**
 * تقطيع مبسّط: تقسيم مبدئي (بادئة/لواحق عربية أو حروف لاتينية)
 * ثم دمج أزواج الرموز الأكثر تكرارًا لحد ما نوصل لحجم مستهدف.
 */
export function tokenize(text) {
  const words = [];
  let pendingSpace = false;

  for (const part of text.split(/(\s+)/).filter((s) => s !== '')) {
    if (/^\s+$/.test(part)) {
      pendingSpace = true;
      continue;
    }
    let symbols;
    if (/^[A-Za-z0-9'’-]+$/.test(part)) symbols = part.toLowerCase().split('');
    else if (isArabicWord(part)) symbols = splitArabic(part).flatMap((piece) => Array.from(piece));
    else symbols = Array.from(part);

    // المسافة بتلزق في أول القطعة اللي بعدها — زي ما المحلّلات الحقيقية بتعمل
    if (pendingSpace && words.length) symbols.unshift('␣');
    pendingSpace = false;
    words.push(symbols);
  }

  const stripped = text.replace(/\s/g, '');
  const chars = stripped.length;
  const arabicShare = (stripped.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length / Math.max(1, chars);
  const average = arabicShare > 0.3 ? 2.4 : 3.6; // العربي بيتطلب قطع أكتر لنفس المعنى
  const target = Math.max(1, Math.ceil(chars / average));

  const mergePair = (a, b) => {
    for (const word of words) {
      for (let i = 0; i < word.length - 1; i++) {
        if (word[i] === a && word[i + 1] === b) {
          word.splice(i, 2, a + b);
          i--;
        }
      }
    }
  };

  let rounds = 0;
  let count = totalPieces(words);
  while (count > target && rounds < 600) {
    const freq = new Map();
    for (const word of words) {
      for (let i = 0; i < word.length - 1; i++) {
        const key = `${word[i]}\u0000${word[i + 1]}`;
        freq.set(key, (freq.get(key) || 0) + 1);
      }
    }
    let bestKey = null;
    let bestScore = -1;
    for (const [key, hits] of freq) {
      const [a, b] = key.split('\u0000');
      const len = a.length + b.length;
      if (len > 6) continue;
      const score = hits * 100 + len * 8; // التكرار أهم، والأطول أفضل عند التساوي
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }
    if (!bestKey) break;
    const [a, b] = bestKey.split('\u0000');
    mergePair(a, b);
    rounds++;
    count = totalPieces(words);
  }

  // صقل أخير: دمج البقايا القصيرة جدًا داخل كل كلمة لتوازن التقطيع
  for (const word of words) {
    for (let i = word.length - 2; i >= 0; i--) {
      if (word[i].length <= 2 && word[i + 1].length <= 2 && word[i].length + word[i + 1].length <= 5) {
        word.splice(i, 2, word[i] + word[i + 1]);
      }
    }
  }

  const pieces = words.flat();
  return { pieces, chars, ratio: chars / Math.max(1, pieces.length) };
}

export function mount(host, { chapter, lang }) {
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

      <div class="tok">
        <div class="prompt__field">
          <textarea class="tok__input" data-input rows="2" placeholder="${esc(ui.placeholder)}" spellcheck="false"></textarea>
          <div class="tok__presets" data-presets></div>
        </div>

        <div class="tok__line" data-line></div>

        <div class="tok__bar">
          <div class="tok__count">
            <span>${ui.pieces}: <b data-pieces>0</b></span>
            <span>${ui.chars}: <b data-chars>0</b></span>
            <span>${ui.ratio}: <b data-ratio>0</b></span>
            <span>${ui.vocab}: <b data-vocab>0</b></span>
          </div>
          <div class="tok__meter"><i data-meter></i></div>
        </div>
      </div>
    </div>
  `;

  const input = $('[data-input]', host);
  const line = $('[data-line]', host);
  const presets = $('[data-presets]', host);
  const verdict = $('[data-verdict]', host);
  const meter = $('[data-meter]', host);
  const out = {
    pieces: $('[data-pieces]', host),
    chars: $('[data-chars]', host),
    ratio: $('[data-ratio]', host),
    vocab: $('[data-vocab]', host),
  };

  presets.innerHTML = ui.presets.map((p) => `<button class="chip-btn" type="button">${esc(p)}</button>`).join('');
  presets.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    input.value = btn.textContent;
    update();
  });

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  const vocabSeen = new Set();

  function update() {
    const text = input.value || '';
    const { pieces, chars, ratio } = tokenize(text);

    line.innerHTML = pieces
      .map((piece, i) => {
        const clean = piece.replaceAll('␣', '');
        const color = PALETTE[hash(clean || '␣') % PALETTE.length];
        const id = hash(clean || '␣') % 50257;
        const space = piece.includes('␣') ? '<span class="space-mark"> </span>' : '';
        return `<span class="tok-piece" style="--i:${i};color:${color};border-color:${color}66;background:${color}1f">
          ${space}${esc(clean)}<small>#${id}</small>
        </span>`;
      })
      .join('');

    pieces.forEach((piece) => vocabSeen.add(piece.replaceAll('␣', '')));

    out.pieces.textContent = String(pieces.length);
    out.chars.textContent = String(chars);
    out.ratio.textContent = ratio.toFixed(2);
    out.vocab.textContent = String(vocabSeen.size);

    meter.style.width = `${clamp((ratio / 4.2) * 100, 3, 100)}%`;

    let label = ui.verdictBad;
    let cls = 'badge--warn';
    if (ratio >= 3.4) {
      label = ui.verdictGood;
      cls = 'badge--good';
    } else if (ratio >= 2.5) {
      label = ui.verdictMid;
      cls = 'badge';
    }
    verdict.className = `badge ${cls}`;
    verdict.textContent = label;
  }

  input.value = ui.presets[0];
  input.addEventListener('input', update);
  update();

  return () => {};
}

function icon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h7v4H4zM13 7h7M4 15h5M11 15h9M4 11h3"/></svg>`;
}
