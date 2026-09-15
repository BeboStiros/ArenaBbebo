/* ============================================================
   toast.js — رسالة عائمة قصيرة
   ============================================================ */

let timer = 0;

export function showToast(message, kind = '') {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.className = `toast is-on ${kind === 'good' ? 'is-good' : kind === 'bad' ? 'is-bad' : ''}`;
  clearTimeout(timer);
  timer = setTimeout(() => node.classList.remove('is-on'), 2600);
}
