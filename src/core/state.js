/* ============================================================
   state.js — حالة الموقع + الحفظ المحلي (بدون أي سيرفر)
   ============================================================ */

const KEY = 'neura.state.v1';

const defaults = {
  lang: 'ar',
  theme: 'dark',
  roadmap: [], // فهارس المراحل المُنجزة
  quizBest: null,
  subscribed: false,
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export const state = read();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* التخزين المحلي قد يكون مقفولًا — الموقع يظل شغّال */
  }
}

export function set(key, value) {
  state[key] = value;
  save();
  return value;
}

export function toggleRoadmap(index) {
  const set_ = new Set(state.roadmap);
  if (set_.has(index)) set_.delete(index);
  else set_.add(index);
  state.roadmap = [...set_].sort((a, b) => a - b);
  save();
  return state.roadmap;
}

export function resetRoadmap() {
  state.roadmap = [];
  save();
}
