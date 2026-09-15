/* ============================================================
   main.js — نقطة التشغيل: يبني الصفحة، يربط التفاعلات، يدير اللغة والمظهر
   ============================================================ */

import './styles/tokens.css';
import './styles/layout.css';
import './styles/widgets.css';

import { chapters } from './data/chapters.js';
import { site } from './data/site.js';
import { t as strings } from './data/strings.js';
import { state, set } from './core/state.js';
import { applyDir, setLang } from './core/i18n.js';
import { $, $$, esc } from './core/dom.js';
import { initDust } from './core/dust.js';
import { initOrb } from './widgets/orb.js';
import { initReveal, initScrollChrome, initScrollSpy, scrollToId, stagger } from './core/scroll.js';
import { renderHero } from './sections/hero.js';
import { renderChapters } from './sections/chapters.js';
import { renderQuiz } from './sections/quiz.js';
import { renderFaq } from './sections/faq.js';
import { renderFooter } from './sections/footer.js';
import { showToast } from './core/toast.js';

let cleanups = [];
let currentSection = 'hero';

/* ------------------------------------------------------------
   المظهر
   ------------------------------------------------------------ */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#eef1fb' : '#05070f');
}

/* ------------------------------------------------------------
   الهيدر: التنقل + السكة الجانبية
   ------------------------------------------------------------ */
function navItems(lang, t) {
  const items = [
    { id: 'hero', label: lang === 'ar' ? 'الرئيسية' : 'Home' },
    { id: 'chapters', label: t.chaptersNav },
  ];
  chapters.forEach((c, i) => items.push({ id: c.id, label: c[lang].nav, min: i >= 4 ? 1250 : 0 }));
  items.push({ id: 'quiz', label: t.quizNav });
  items.push({ id: 'faq', label: t.faqNav });
  return items;
}

function renderNav() {
  const lang = state.lang;
  const t = strings(lang);
  const nav = $('#nav');
  const rail = $('#rail');

  nav.innerHTML = navItems(lang, t)
    .map(
      (item) =>
        `<a href="#${item.id}" data-nav="${item.id}"${item.min ? ` data-min="${item.min}"` : ''}>${esc(item.label)}</a>`
    )
    .join('');

  rail.innerHTML = [
    { id: 'hero', label: lang === 'ar' ? 'البداية' : 'Intro' },
    ...chapters.map((c) => ({ id: c.id, label: c[lang].nav })),
    { id: 'quiz', label: t.quizNav },
  ]
    .map((item) => `<a href="#${item.id}" data-rail="${item.id}" data-label="${esc(item.label)}" aria-label="${esc(item.label)}"></a>`)
    .join('');
}

/* ------------------------------------------------------------
   البناء الكامل للصفحة
   ------------------------------------------------------------ */
function renderApp() {
  const lang = state.lang;
  const t = strings(lang);
  applyDir(lang);

  // تنظيف وحدات الفصل السابقة
  cleanups.forEach((fn) => {
    try {
      fn?.();
    } catch {
      /* تجاهل */
    }
  });
  cleanups = [];

  // نصوص العلامة في الهيدر
  $('#brandName').textContent = site.brand[lang];
  $('#brandSub').textContent = site.tagline[lang];
  $('#langLabel').textContent = t.langButton;
  $('#langToggle').setAttribute('title', t.langButtonTitle);
  $('#themeToggle').setAttribute('title', t.themeTitle);
  $('#toTop').setAttribute('aria-label', t.toTop);
  $('#nav').setAttribute('aria-label', t.navLabel);
  $('#rail').setAttribute('aria-label', t.chIndex);
  $('#skipLink').textContent = lang === 'ar' ? 'تخطَّ إلى المحتوى' : 'Skip to content';

  renderNav(t);

  const hero = renderHero($('#hero'), { lang, t });
  cleanups.push(renderChapters($('#chapters'), { lang, t }));
  renderQuiz($('#quiz'), { lang, t });
  renderFaq($('#faq'), { lang, t });
  renderFooter($('#footer'), { lang, t });

  if (hero?.orb) cleanups.push(initOrb(hero.orb));

  stagger(document);
  initReveal(document);
}

/* ------------------------------------------------------------
   تبديل اللغة مع الحفاظ على موضع القراءة
   ------------------------------------------------------------ */
function switchLang(next) {
  const ratio = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  setLang(next);
  renderApp();
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: ratio * max, behavior: 'auto' });
    // فحص الظهور بعد إعادة البناء
    window.dispatchEvent(new Event('resize'));
    document.querySelector(`[data-nav="${currentSection}"]`)?.classList.add('is-active');
  });
}

/* ------------------------------------------------------------
   التشغيل
   ------------------------------------------------------------ */
function boot() {
  applyTheme(state.theme);
  document.body.id = 'top';
  renderApp();

  // خلفية الغبار
  cleanups.push(initDust($('#dust')));

  // شاشة التشغيل
  const bootEl = $('#boot');
  const hideBoot = () => bootEl?.classList.add('is-done');
  window.setTimeout(hideBoot, 520);
  window.addEventListener('load', () => window.setTimeout(hideBoot, 120), { once: true });

  // الأدوات العامة
  $('#themeToggle').addEventListener('click', () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    set('theme', next);
    applyTheme(next);
  });

  $('#langToggle').addEventListener('click', () => {
    switchLang(state.lang === 'ar' ? 'en' : 'ar');
    showToast(state.lang === 'ar' ? 'تم التحويل للعربية' : 'Switched to English');
  });

  // قائمة الموبايل (الشريط السفلي العائم)
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  const closeMenu = () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  };

  // الزر بيظهر بس لو القائمة اتخفت (شاشات ضيقة جدًا)
  let menuVisible = false;
  const syncMenuBtn = () => {
    menuVisible = getComputedStyle(menuBtn).display !== 'none';
    menuBtn.hidden = !menuVisible;
  };
  syncMenuBtn();

  menuBtn.addEventListener('click', () => {
    if (!menuVisible) return;
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (e.target.closest('#nav') || e.target.closest('#menuBtn')) return;
    closeMenu();
  });

  // روابط داخلية بحركة سلسة
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    closeMenu();
    scrollToId(id);
    history.replaceState(null, '', `#${id}`);
  });

  // شريط التقدم + الهيدر
  initScrollChrome();

  // تتبع القسم الحالي
  const ids = ['hero', 'chapters-intro', ...chapters.map((c) => c.id), 'quiz', 'faq'];
  initScrollSpy(ids, (id) => {
    if (id === currentSection) return;
    currentSection = id === 'chapters-intro' ? 'chapters' : id;
    $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === currentSection));
    $$('[data-rail]').forEach((a) => a.classList.toggle('is-active', a.dataset.rail === currentSection));

    // على الموبايل: خلي العنصر النشط دايمًا ظاهر في الشريط
    if (window.innerWidth <= 900) {
      const active = nav.querySelector(`[data-nav="${currentSection}"]`);
      if (active) {
        const target = active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2;
        nav.scrollTo({ left: target, behavior: 'smooth' });
      }
    }
  });

  // إشارة خفيفة للجوال: تم إخفاء القائمة عند التمرير
  window.addEventListener(
    'resize',
    () => {
      syncMenuBtn();
      if (window.innerWidth > 900) closeMenu();
    },
    { passive: true }
  );

  // اختصارات لوحة المفاتيح
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === '/') {
      e.preventDefault();
      scrollToId('chapters');
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
