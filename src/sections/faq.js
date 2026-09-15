/* ============================================================
   sections/faq.js — الأسئلة الشائعة (أكورديون)
   ============================================================ */

import { faq } from '../data/faq.js';
import { esc } from '../core/dom.js';

export function renderFaq(root, { lang, t }) {
  const items = faq[lang];

  root.className = 'section';
  root.id = 'faq';
  root.setAttribute('aria-labelledby', 'faq-title');
  root.innerHTML = `
    <div class="wrap">
      <div class="sec-head" data-reveal>
        <span class="eyebrow"><i></i>${esc(t.faq.title)}</span>
        <h2 id="faq-title">${esc(t.faq.title)}</h2>
        <p>${esc(t.faq.lead)}</p>
      </div>

      <div class="faq-grid">
        ${items
          .map(
            (item, i) => `
          <details class="acc" data-reveal ${i === 0 ? 'open' : ''}>
            <summary>${esc(item.q)}</summary>
            <div class="acc__body">${esc(item.a)}</div>
          </details>`
          )
          .join('')}
      </div>
    </div>
  `;

  // أكورديون واحد مفتوح في الوقت نفسه (تجربة أنظف)
  const all = Array.from(root.querySelectorAll('details.acc'));
  all.forEach((node) => {
    node.addEventListener('toggle', () => {
      if (!node.open) return;
      all.forEach((other) => {
        if (other !== node) other.open = false;
      });
    });
  });

  return () => {};
}
