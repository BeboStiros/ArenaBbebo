/* ============================================================
   widgets/train.js — تدريب حقيقي: منحنى B-spline + نزول تدرّج
   يوضّح: التعميم، الحفظ (Overfitting)، والتبسيط (Underfitting)
   ============================================================ */

import { $, clamp, observeVisibility, randn, prefersReducedMotion } from '../core/dom.js';

const TRUE_FN = (x) => clamp(0.5 + 0.3 * Math.sin(2 * Math.PI * x * 0.9 + 0.35) + 0.07 * Math.cos(2 * Math.PI * x * 3.3), 0.05, 0.95);

/* أساسيات B-spline التكعيبية المنتظمة */
const B0 = (u) => ((1 - u) ** 3) / 6;
const B1 = (u) => (3 * u ** 3 - 6 * u ** 2 + 4) / 6;
const B2 = (u) => (-3 * u ** 3 + 3 * u ** 2 + 3 * u + 1) / 6;
const B3 = (u) => (u ** 3) / 6;

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

      <div class="train">
        <div class="train__chart"><canvas data-chart></canvas></div>

        <div class="train__stats">
          <div class="metric" data-m-epoch><b>0</b><span>${ui.epochs}</span></div>
          <div class="metric metric--good" data-m-train><b>0.000</b><span>${ui.trainLoss}</span></div>
          <div class="metric" data-m-val><b>0.000</b><span>${ui.valLoss}</span></div>
        </div>

        <div class="demo__controls">
          <label class="ctrl">
            <span class="ctrl__label"><span>${ui.lr}</span><b data-lr-val>0.08</b></span>
            <input type="range" min="0.01" max="0.5" step="0.01" value="0.08" data-lr>
          </label>
          <label class="ctrl">
            <span class="ctrl__label"><span>${ui.noise}</span><b data-noise-val>3%</b></span>
            <input type="range" min="0" max="12" step="1" value="3" data-noise>
          </label>
          <label class="ctrl">
            <span class="ctrl__label"><span>${ui.flexibility}</span><b data-flex-val>8</b></span>
            <input type="range" min="4" max="16" step="1" value="8" data-flex>
          </label>
        </div>

        <div class="demo__controls">
          <button class="btn btn--primary btn--sm" data-auto>${ui.auto}</button>
          <button class="btn btn--ghost btn--sm" data-step>${ui.step}</button>
          <button class="btn btn--ghost btn--sm" data-reset>${ui.reset}</button>
        </div>

        <div class="legend">
          <span><i style="background:linear-gradient(90deg,#a78bfa,#22d3ee)"></i>${ui.line}</span>
          <span><i style="background:repeating-linear-gradient(90deg,#94a3b8 0 4px,transparent 4px 8px)"></i>${ui.exact}</span>
        </div>
      </div>
    </div>
  `;

  /* ---------- البيانات ---------- */
  let noise = 0.03;
  let trainData = [];
  let valData = [];

  function makeData() {
    trainData = [];
    for (let i = 0; i < 12; i++) {
      const x = 0.04 + (i / 11) * 0.92;
      trainData.push({ x, y: clamp(TRUE_FN(x) + randn() * noise * 2.2, 0.03, 0.97) });
    }
    valData = [];
    for (let i = 0; i < 40; i++) {
      const x = 0.02 + (i / 39) * 0.96;
      valData.push({ x, y: TRUE_FN(x) });
    }
  }

  /* ---------- النموذج ---------- */
  let k = 8; // عدد نقاط التحكم
  let w = new Float32Array(k).fill(0.5);
  let vel = new Float32Array(k);
  let lr = 0.08;
  let epochs = 0;
  let trainLoss = 0;
  let valLoss = 0;
  let history = [];
  let auto = false;

  function basis(x) {
    const t = clamp(x, 0, 1) * (k - 3);
    let seg = Math.floor(t);
    if (seg > k - 4) seg = k - 4;
    if (seg < 0) seg = 0;
    const u = clamp(t - seg, 0, 0.9999);
    return [seg, B0(u), B1(u), B2(u), B3(u)];
  }

  function predict(x, weights = w) {
    const [seg, b0, b1, b2, b3] = basis(x);
    return b0 * weights[seg] + b1 * weights[seg + 1] + b2 * weights[seg + 2] + b3 * weights[seg + 3];
  }

  function evaluate() {
    let tr = 0;
    for (const p of trainData) tr += (predict(p.x) - p.y) ** 2;
    trainLoss = tr / trainData.length;
    let va = 0;
    for (const p of valData) va += (predict(p.x) - p.y) ** 2;
    valLoss = va / valData.length;
    history.push({ trainLoss, valLoss });
    if (history.length > 400) history.shift();
  }

  function stepTrain() {
    const grad = new Float32Array(k);
    for (const p of trainData) {
      const err = predict(p.x) - p.y;
      const [seg, b0, b1, b2, b3] = basis(p.x);
      const scale = (2 * err) / trainData.length;
      grad[seg] += scale * b0;
      grad[seg + 1] += scale * b1;
      grad[seg + 2] += scale * b2;
      grad[seg + 3] += scale * b3;
    }
    const momentum = 0.85;
    for (let i = 0; i < k; i++) {
      vel[i] = momentum * vel[i] - lr * grad[i];
      w[i] += vel[i];
    }
    epochs++;
    evaluate();
  }

  function resetModel() {
    w = new Float32Array(k).fill(0.5);
    vel = new Float32Array(k);
    epochs = 0;
    history = [];
    evaluate();
  }

  /* ---------- الأبعاد ---------- */
  const canvas = $('[data-chart]', host);
  const ctx = canvas.getContext('2d');
  let W = 400;
  let H = 190;
  let dpr = 1;

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(240, Math.round(rect.width));
    H = Math.max(140, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const PAD = { l: 30, r: 12, t: 14, b: 20 };
  const toPx = (x, y) => ({
    px: PAD.l + x * (W - PAD.l - PAD.r),
    py: H - PAD.b - y * (H - PAD.t - PAD.b),
  });

  /* ---------- الرسم ---------- */
  function draw() {
    if (!ctx) return;
    const light = document.documentElement.dataset.theme === 'light';
    ctx.clearRect(0, 0, W, H);

    // شبكة
    ctx.strokeStyle = light ? 'rgba(19,26,58,.08)' : 'rgba(255,255,255,.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + ((H - PAD.t - PAD.b) * i) / 4;
      ctx.beginPath();
      ctx.moveTo(PAD.l, y);
      ctx.lineTo(W - PAD.r, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = PAD.l + ((W - PAD.l - PAD.r) * i) / 6;
      ctx.beginPath();
      ctx.moveTo(x, PAD.t);
      ctx.lineTo(x, H - PAD.b);
      ctx.stroke();
    }

    // نقاط التحقق (باهتة)
    ctx.fillStyle = light ? 'rgba(19,26,58,.14)' : 'rgba(255,255,255,.13)';
    for (const p of valData) {
      const { px, py } = toPx(p.x, p.y);
      ctx.beginPath();
      ctx.arc(px, py, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // المنحنى الحقيقي
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = light ? 'rgba(71,85,105,.75)' : 'rgba(148,163,184,.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const x = i / 120;
      const { px, py } = toPx(x, TRUE_FN(x));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // خط التحكم (شفاف) لتوضيح مرونة النموذج
    ctx.strokeStyle = light ? 'rgba(139,92,246,.22)' : 'rgba(167,139,250,.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < k; i++) {
      const x = (i - 1.5) / (k - 3);
      const { px, py } = toPx(clamp(x, 0, 1), clamp(w[i], 0.02, 0.98));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = light ? 'rgba(139,92,246,.5)' : 'rgba(167,139,250,.6)';
    for (let i = 0; i < k; i++) {
      const x = (i - 1.5) / (k - 3);
      const { px, py } = toPx(clamp(x, 0, 1), clamp(w[i], 0.02, 0.98));
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // المنحنى المُتعلَّم
    const grad = ctx.createLinearGradient(PAD.l, 0, W - PAD.r, 0);
    grad.addColorStop(0, '#a78bfa');
    grad.addColorStop(0.5, '#22d3ee');
    grad.addColorStop(1, '#34d399');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const x = i / 160;
      const { px, py } = toPx(x, clamp(predict(x), 0, 1));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();

    // بيانات التدريب
    for (const p of trainData) {
      const { px, py } = toPx(p.x, p.y);
      ctx.beginPath();
      ctx.arc(px, py, 4.4, 0, Math.PI * 2);
      ctx.fillStyle = light ? '#ffffff' : '#080c18';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#f472b6';
      ctx.fill();
    }

    // مخطط الخسارة الداخلي
    drawSparkline(light);
  }

  function drawSparkline(light) {
    if (history.length < 2) return;
    const w0 = 92;
    const h0 = 34;
    const x0 = W - PAD.r - w0;
    const y0 = PAD.t + 2;
    ctx.save();
    ctx.globalAlpha = light ? 0.9 : 0.85;
    ctx.fillStyle = light ? 'rgba(255,255,255,.7)' : 'rgba(8,12,24,.6)';
    ctx.strokeStyle = light ? 'rgba(19,26,58,.12)' : 'rgba(255,255,255,.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w0, h0, 8);
    ctx.fill();
    ctx.stroke();

    const maxV = Math.max(...history.map((h) => h.trainLoss), 0.02);
    const minV = Math.min(...history.map((h) => h.trainLoss), 0.0005);
    const logMin = Math.log(minV);
    const logSpan = Math.log(maxV) - logMin || 1;
    const norm = (v) => (Math.log(Math.max(v, minV)) - logMin) / logSpan;

    for (const [key, color] of [
      ['valLoss', '#fbbf24'],
      ['trainLoss', '#34d399'],
    ]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      history.forEach((h, i) => {
        const px = x0 + 4 + ((w0 - 8) * i) / (history.length - 1);
        const py = y0 + h0 - 4 - norm(h[key]) * (h0 - 10);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- تحديث الواجهة ---------- */
  const metrics = {
    epoch: host.querySelector('[data-m-epoch] b'),
    train: host.querySelector('[data-m-train] b'),
    val: host.querySelector('[data-m-val] b'),
  };
  const verdict = $('[data-verdict]', host);

  function updateUI() {
    metrics.epoch.textContent = String(epochs);
    metrics.train.textContent = trainLoss.toFixed(4);
    metrics.val.textContent = valLoss.toFixed(4);

    let text = ui.good;
    let cls = 'badge badge--good';
    if (trainLoss < 0.0015 && valLoss > Math.max(trainLoss * 4, 0.006)) {
      text = ui.overfit;
      cls = 'badge badge--warn';
    } else if (trainLoss > 0.02) {
      text = ui.underfit;
      cls = 'badge';
    }
    verdict.className = cls;
    verdict.textContent = text;

    host.querySelector('[data-m-train]').className = 'metric metric--good';
    host.querySelector('[data-m-val]').className = `metric ${valLoss > trainLoss * 2.2 ? 'metric--warn' : ''}`;
  }

  /* ---------- الحلقة ---------- */
  let raf = 0;
  let frame = 0;
  let onScreen = true;

  function loop() {
    frame++;
    if (!onScreen) {
      raf = requestAnimationFrame(loop);
      return;
    }
    if (auto) {
      for (let i = 0; i < 2; i++) stepTrain();
      updateUI();
      if (frame % 2 === 0) draw();
      if (epochs > 900) {
        auto = false;
        autoBtn.textContent = ui.auto;
        autoBtn.classList.remove('btn--ghost');
        autoBtn.classList.add('btn--primary');
      }
    } else if (frame % 24 === 0) {
      draw();
    }
    raf = requestAnimationFrame(loop);
  }

  /* ---------- التحكم ---------- */
  const autoBtn = $('[data-auto]', host);
  autoBtn.addEventListener('click', () => {
    auto = !auto;
    autoBtn.textContent = auto ? ui.pause : ui.auto;
    autoBtn.classList.toggle('btn--primary', !auto);
    autoBtn.classList.toggle('btn--ghost', auto);
  });
  $('[data-step]', host).addEventListener('click', () => {
    stepTrain();
    updateUI();
    draw();
  });
  $('[data-reset]', host).addEventListener('click', () => {
    makeData();
    resetModel();
    updateUI();
    draw();
  });

  const lrInput = $('[data-lr]', host);
  const lrVal = $('[data-lr-val]', host);
  lrInput.addEventListener('input', () => {
    lr = Number(lrInput.value);
    lrVal.textContent = lr.toFixed(2);
    lrInput.style.setProperty('--fill', `${lr * 200}%`);
  });
  lrInput.dispatchEvent(new Event('input'));

  const noiseInput = $('[data-noise]', host);
  const noiseVal = $('[data-noise-val]', host);
  noiseInput.addEventListener('input', () => {
    noise = Number(noiseInput.value) / 100;
    noiseVal.textContent = `${noiseInput.value}%`;
    noiseInput.style.setProperty('--fill', `${(Number(noiseInput.value) / 12) * 100}%`);
    makeData();
    draw();
  });
  noiseInput.dispatchEvent(new Event('input'));

  const flexInput = $('[data-flex]', host);
  const flexVal = $('[data-flex-val]', host);
  flexInput.addEventListener('input', () => {
    k = Number(flexInput.value);
    flexVal.textContent = String(k);
    flexInput.style.setProperty('--fill', `${((k - 4) / 12) * 100}%`);
    resetModel();
    updateUI();
    draw();
  });
  flexInput.dispatchEvent(new Event('input'));

  /* ---------- تشغيل ---------- */
  makeData();
  resetModel();
  fit();
  updateUI();
  draw();

  const ro = new ResizeObserver(() => {
    fit();
    draw();
  });
  ro.observe(canvas);
  const stopVisible = observeVisibility(canvas, (visible) => {
    onScreen = visible;
    if (visible) draw();
  });

  if (!prefersReducedMotion()) {
    setTimeout(() => {
      if (document.body.contains(canvas)) {
        auto = true;
        autoBtn.textContent = ui.pause;
        autoBtn.classList.remove('btn--primary');
        autoBtn.classList.add('btn--ghost');
      }
    }, 2200);
    raf = requestAnimationFrame(loop);
  }

  return () => {
    auto = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    stopVisible();
  };
}

function icon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 17c3-6 6 3 9-1s5-8 9-6"/><circle cx="6" cy="18" r="1.6"/><circle cx="12" cy="13" r="1.6"/><circle cx="18" cy="8" r="1.6"/></svg>`;
}
