/* ============================================================
   i18n.js — اللغة والاتجاه
   ============================================================ */

import { state, set } from './state.js';

/** يقرأ قيمة ثنائية اللغة {ar, en} */
export const L = (pair, lang = state.lang) => (pair ? pair[lang] ?? pair.ar : '') ?? '';

export function applyDir(lang = state.lang) {
  const html = document.documentElement;
  html.lang = lang === 'ar' ? 'ar' : 'en';
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function isAr(lang = state.lang) {
  return lang === 'ar';
}

export function setLang(lang) {
  set('lang', lang === 'en' ? 'en' : 'ar');
  applyDir(lang);
}

export function toggleLang() {
  setLang(state.lang === 'ar' ? 'en' : 'ar');
  return state.lang;
}
