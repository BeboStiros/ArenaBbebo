/* ============================================================
   sections/footer.js — الفوتر + الاشتراك في القائمة البريدية
   ============================================================ */

import { site, socials } from '../data/site.js';
import { esc } from '../core/dom.js';
import { state, set } from '../core/state.js';
import { showToast } from '../core/toast.js';

export function renderFooter(root, { lang, t }) {
  const f = site.footer[lang];
  const year = new Date().getFullYear();

  root.innerHTML = `
    <div class="wrap">
      <div class="footer__grid">
        <div class="footer__brand">
          <a class="brand" href="#hero">
            <span class="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#a78bfa" stroke-width="1.6" opacity=".7" />
                <circle cx="24" cy="24" r="12.5" fill="none" stroke="#22d3ee" stroke-width="1.6" opacity=".55" />
                <circle cx="24" cy="24" r="4.6" fill="#22d3ee" />
              </svg>
            </span>
            <span class="brand__text">
              <span class="brand__name">${esc(site.brand[lang])}</span>
              <span class="brand__sub">${esc(site.tagline[lang])}</span>
            </span>
          </a>
          <p>${esc(f.about)}</p>
          <div class="footer__social">
            ${socials
              .map(
                (s) => `<a class="icon-btn" href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.label)}">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="${s.path}" /></svg>
                </a>`
              )
              .join('')}
          </div>
        </div>

        ${f.cols
          .map(
            (col) => `
          <div>
            <h4>${esc(col.title)}</h4>
            <ul>${col.links.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('')}</ul>
          </div>`
          )
          .join('')}

        <div>
          <h4>${esc(f.newsTitle)}</h4>
          <form class="footer__news" data-news novalidate>
            <input type="email" placeholder="${esc(f.newsPlaceholder)}" aria-label="${esc(f.newsTitle)}" />
            <button class="btn btn--primary btn--sm" type="submit">${esc(f.newsBtn)}</button>
          </form>
          <p class="muted" style="font-size:.82rem;margin-top:10px">${esc(f.madeWith)}</p>
        </div>
      </div>

      <div class="footer__bottom">
        <span>© ${year} ${esc(site.brand[lang])} — ${esc(f.rights)}</span>
        <span>${esc(t.interactive)} · ${esc(t.levelBeginner)}</span>
        <button class="chip-btn" type="button" data-share>${esc(f.shareLink)}</button>
      </div>
    </div>
  `;

  root.querySelector('[data-share]').addEventListener('click', async () => {
    const url = window.location.href.split('#')[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: site.brand[lang], url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast(t.linkCopied, 'good');
    } catch {
      showToast(t.copyFail, 'bad');
    }
  });

  const form = root.querySelector('[data-news]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    if (!ok) {
      showToast(f.newsBad, 'bad');
      input.focus();
      return;
    }
    set('subscribed', true);
    showToast(state.subscribed ? f.newsOk : t.subscribeOk, 'good');
    input.value = '';
  });

  return () => {};
}
