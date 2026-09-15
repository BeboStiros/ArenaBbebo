/* ============================================================
   widgets/neural.js — شبكة عصبية حقيقية (2-6-5-4) بتتدرّب في المتصفح
   تمرير أمامي وعكسي ونزول تدرّج — كلها مكتوبة من الصفر
   ============================================================ */

import { $, clamp, observeVisibility, randn } from '../core/dom.js';

const CLASS_COLORS = ['#8b5cf6', '#22d3ee', '#34d399', '#f472b6'];
const LAYERS = [2, 6, 5, 4];

export function mount(host, { chapter, lang }) {
  const ui = chapter[lang].ui;
  const ar = lang === 'ar';

  host.innerHTML = `
    <div class="demo__panel glass glass--spot" style="--accent:${chapter.accent};--accent-2:${chapter.accent2}">
      <div class="demo__row">
        <div>
          <div class="demo__title"><i>${icon()}</i><span>${chapter[lang].demo.title}</span></div>
          <p class="demo__hint">${ui.hint}</p>
        </div>
        <div class="demo__controls">
          <span class="badge" data-m="epoch">${ui.epoch}: 0</span>
          <span class="badge" data-m="acc">${ui.accuracy}: 0%</span>
          <span class="badge" data-m="loss">${ui.loss}: 1.386</span>
        </div>
      </div>

      <div class="nn">
        <div class="nn__stage">
          <canvas class="nn__canvas" role="img" aria-label="${ui.hint}"></canvas>
          <div class="nn__layers" data-layers></div>
        </div>
        <div class="nn__out" data-out></div>
      </div>

      <div class="demo__controls" style="margin-top:4px">
        <label class="ctrl">
          <span class="ctrl__label"><span>${ui.learningRate ?? (ar ? 'سرعة التعلّم' : 'Learning rate')}</span><b data-lr-val>0.35</b></span>
          <input type="range" min="0.02" max="0.9" step="0.01" value="0.35" data-lr>
        </label>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <button class="btn btn--primary btn--sm" data-play>${ui.play}</button>
          <button class="btn btn--ghost btn--sm" data-step>${ui.step}</button>
          <button class="btn btn--ghost btn--sm" data-reset>${ui.reset}</button>
          <button class="chip-btn" data-weights>${ui.weightsOn}</button>
        </div>
      </div>
    </div>
  `;

  const canvas = $('.nn__canvas', host);
  const layersEl = $('[data-layers]', host);
  const outEl = $('[data-out]', host);
  const ctx = canvas.getContext('2d');

  layersEl.innerHTML = ui.labels.map((l) => `<span>${l}</span>`).join('');

  /* ---------- الأوزان ---------- */
  const shapes = [];
  for (let i = 0; i < LAYERS.length - 1; i++) shapes.push([LAYERS[i], LAYERS[i + 1]]);
  const W = shapes.map(([a, b]) => {
    const arr = new Float32Array(a * b);
    for (let i = 0; i < arr.length; i++) arr[i] = randn() * Math.sqrt(2 / a);
    return arr;
  });
  const B = LAYERS.slice(1).map(() => new Float32Array(LAYERS[1] ? 0 : 0) || new Float32Array(0));
  // انحيازات مهيّأة
  const bias = LAYERS.slice(1).map((n) => {
    const arr = new Float32Array(n);
    for (let i = 0; i < n; i++) arr[i] = randn() * 0.1;
    return arr;
  });
  void B;

  const vel = W.map((w) => new Float32Array(w.length));
  const velB = bias.map((b) => new Float32Array(b.length));

  let lr = 0.35;
  const momentum = 0.86;
  let epoch = 0;
  let playing = false;
  let showWeights = true;
  let loss = 1.386;
  let acc = 0;

  /* ---------- منشئ البيانات ---------- */
  const CENTERS = [
    [0.26, 0.24],
    [0.74, 0.3],
    [0.28, 0.76],
    [0.72, 0.72],
  ];
  let data = [];
  let probe = { x: 0.5, y: 0.5, on: false };
  let probs = [0.25, 0.25, 0.25, 0.25];

  function newData() {
    data = [];
    CENTERS.forEach(([cx, cy], cls) => {
      for (let i = 0; i < 11; i++) {
        data.push({
          x: clamp(cx + randn() * 0.062, 0.02, 0.98),
          y: clamp(cy + randn() * 0.062, 0.02, 0.98),
          cls,
        });
      }
    });
  }

  /* ---------- الحساب ---------- */
  const act = LAYERS.map((n) => new Float32Array(n));
  const pre = LAYERS.map((n) => new Float32Array(n));
  const delta = LAYERS.map((n) => new Float32Array(n));

  function forward(x0, x1) {
    act[0][0] = x0;
    act[0][1] = x1;
    for (let l = 0; l < shapes.length; l++) {
      const [nIn, nOut] = shapes[l];
      const w = W[l];
      const b = bias[l];
      for (let j = 0; j < nOut; j++) {
        let s = b[j];
        const base = j * nIn;
        for (let i = 0; i < nIn; i++) s += w[base + i] * act[l][i];
        pre[l + 1][j] = s;
        act[l + 1][j] = l === shapes.length - 1 ? s : s > 0 ? s : 0;
      }
    }
    // softmax
    const last = act[LAYERS.length - 1];
    let max = -Infinity;
    for (let i = 0; i < last.length; i++) if (last[i] > max) max = last[i];
    let sum = 0;
    for (let i = 0; i < last.length; i++) {
      last[i] = Math.exp(last[i] - max);
      sum += last[i];
    }
    for (let i = 0; i < last.length; i++) last[i] /= sum;
    return last;
  }

  function zeroGrads() {
    const gW = W.map((w) => new Float32Array(w.length));
    const gB = bias.map((b) => new Float32Array(b.length));
    return { gW, gB };
  }

  function accumulate(g, cls) {
    const out = act[LAYERS.length - 1];
    for (let i = 0; i < out.length; i++) delta[LAYERS.length - 1][i] = out[i] - (i === cls ? 1 : 0);

    for (let l = shapes.length - 1; l >= 0; l--) {
      const [nIn, nOut] = shapes[l];
      const w = W[l];
      for (let j = 0; j < nOut; j++) {
        const d = delta[l + 1][j];
        if (!d) continue;
        const base = j * nIn;
        for (let i = 0; i < nIn; i++) g.gW[l][base + i] += d * act[l][i];
        g.gB[l][j] += d;
      }
      if (l > 0) {
        const prev = delta[l];
        prev.fill(0);
        for (let j = 0; j < nOut; j++) {
          const d = delta[l + 1][j];
          if (!d) continue;
          const base = j * nIn;
          for (let i = 0; i < nIn; i++) prev[i] += w[base + i] * d;
        }
        for (let i = 0; i < nIn; i++) if (pre[l][i] <= 0) prev[i] = 0; // ReLU'
      }
    }
  }

  function trainEpoch() {
    const g = zeroGrads();
    let correct = 0;
    let totalLoss = 0;
    for (const p of data) {
      const out = forward(p.x, p.y);
      accumulate(g, p.cls);
      totalLoss += -Math.log(Math.max(out[p.cls], 1e-9));
      let best = 0;
      for (let i = 1; i < out.length; i++) if (out[i] > out[best]) best = i;
      if (best === p.cls) correct++;
    }
    const n = data.length;
    for (let l = 0; l < W.length; l++) {
      const w = W[l];
      const gw = g.gW[l];
      const v = vel[l];
      const b = bias[l];
      const gb = g.gB[l];
      const vb = velB[l];
      for (let i = 0; i < w.length; i++) {
        v[i] = momentum * v[i] - (lr * gw[i]) / n;
        w[i] += v[i];
      }
      for (let i = 0; i < b.length; i++) {
        vb[i] = momentum * vb[i] - (lr * gb[i]) / n;
        b[i] += vb[i];
      }
    }
    epoch++;
    loss = totalLoss / n;
    acc = correct / n;
  }

  /* ---------- حقل القرار (كانفس صغير مكبَّر) ---------- */
  const FIELD_W = 76;
  const FIELD_H = 60;
  const field = document.createElement('canvas');
  field.width = FIELD_W;
  field.height = FIELD_H;
  const fctx = field.getContext('2d');
  const img = fctx.createImageData(FIELD_W, FIELD_H);

  function renderField() {
    const rgb = CLASS_COLORS.map(hexToRgb);
    for (let y = 0; y < FIELD_H; y++) {
      for (let x = 0; x < FIELD_W; x++) {
        const out = forward(x / (FIELD_W - 1), 1 - y / (FIELD_H - 1));
        let r = 0;
        let g = 0;
        let b = 0;
        for (let c = 0; c < 4; c++) {
          const p = out[c] * out[c];
          r += rgb[c][0] * p;
          g += rgb[c][1] * p;
          b += rgb[c][2] * p;
        }
        const i = (y * FIELD_W + x) * 4;
        const dim = document.documentElement.dataset.theme === 'light' ? 0.82 : 0.62;
        img.data[i] = r * dim + (document.documentElement.dataset.theme === 'light' ? 60 : 6);
        img.data[i + 1] = g * dim + (document.documentElement.dataset.theme === 'light' ? 60 : 8);
        img.data[i + 2] = b * dim + (document.documentElement.dataset.theme === 'light' ? 60 : 20);
        img.data[i + 3] = document.documentElement.dataset.theme === 'light' ? 210 : 235;
      }
    }
    fctx.putImageData(img, 0, 0);
  }

  /* ---------- الرسم ---------- */
  let cssW = 320;
  let cssH = 300;

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(240, Math.round(rect.width));
    cssH = Math.max(220, Math.round(rect.height));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const stacked = () => cssW < 620;

  function layout() {
    const pad = 14;
    if (stacked()) {
      const fh = Math.round(cssH * 0.56);
      return { field: { x: pad, y: pad, w: cssW - pad * 2, h: fh - pad }, net: { x: pad, y: fh, w: cssW - pad * 2, h: cssH - fh } };
    }
    const fw = Math.round(cssW * 0.6);
    return { field: { x: pad, y: pad, w: fw - pad, h: cssH - pad * 2 }, net: { x: fw + 6, y: 10, w: cssW - fw - 16, h: cssH - 20 } };
  }

  function draw() {
    if (!ctx) return;
    const L = layout();
    ctx.clearRect(0, 0, cssW, cssH);

    // ----- حقل القرار -----
    const f = L.field;
    ctx.save();
    roundRect(ctx, f.x, f.y, f.w, f.h, 16);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(field, f.x, f.y, f.w, f.h);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1;
    roundRect(ctx, f.x, f.y, f.w, f.h, 16);
    ctx.stroke();
    ctx.restore();

    // النقاط
    for (const p of data) {
      const px = f.x + p.x * f.w;
      const py = f.y + (1 - p.y) * f.h;
      ctx.beginPath();
      ctx.arc(px, py, 4.6, 0, Math.PI * 2);
      ctx.fillStyle = '#04060f';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 3.1, 0, Math.PI * 2);
      ctx.fillStyle = CLASS_COLORS[p.cls];
      ctx.fill();
    }

    // نقطة الاستعلام
    if (probe.on) {
      const px = f.x + probe.x * f.w;
      const py = f.y + (1 - probe.y) * f.h;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      const win = probs.indexOf(Math.max(...probs));
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fillStyle = CLASS_COLORS[win] + '33';
      ctx.fill();
      ctx.font = '600 11px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      const label = `${(probs[win] * 100 || 0).toFixed(0)}%`;
      const tx = clamp(px + 14, f.x + 4, f.x + f.w - 30);
      const ty = clamp(py - 12, f.y + 14, f.y + f.h - 6);
      ctx.fillText(label, tx, ty);
    }

    // ----- مخطط الشبكة -----
    const n = L.net;
    const nodes = LAYERS.map((count, li) => {
      const x = n.x + (n.w * li) / (LAYERS.length - 1);
      const arr = [];
      for (let i = 0; i < count; i++) {
        const y = n.y + (n.h * (i + 1)) / (count + 1);
        arr.push({ x, y });
      }
      return arr;
    });

    const actMax = LAYERS.map((c, li) => {
      let m = 0;
      for (let i = 0; i < c; i++) m = Math.max(m, Math.abs(act[li][i]));
      return m || 1;
    });

    // الأوزان
    for (let l = 0; l < shapes.length; l++) {
      const [nIn, nOut] = shapes[l];
      const w = W[l];
      for (let j = 0; j < nOut; j++) {
        for (let i = 0; i < nIn; i++) {
          const weight = w[j * nIn + i];
          const alpha = showWeights ? clamp(Math.abs(weight) * 0.55, 0.04, 0.7) : 0.05;
          const mag = clamp(Math.abs(weight) * 3.2, 0.6, 3.4);
          ctx.strokeStyle =
            weight >= 0
              ? `rgba(34, 211, 238, ${alpha})`
              : `rgba(244, 114, 182, ${alpha})`;
          ctx.lineWidth = showWeights ? mag * 0.5 : 0.6;
          ctx.beginPath();
          ctx.moveTo(nodes[l][i].x, nodes[l][i].y);
          ctx.lineTo(nodes[l + 1][j].x, nodes[l + 1][j].y);
          ctx.stroke();
        }
      }
    }

    // الخلايا
    for (let l = 0; l < LAYERS.length; l++) {
      for (let i = 0; i < LAYERS[l]; i++) {
        const node = nodes[l][i];
        const a = clamp(Math.abs(act[l][i]) / actMax[l], 0, 1);
        const r = l === 0 ? 7 : l === LAYERS.length - 1 ? 8 : 6.4;
        const color =
          l === LAYERS.length - 1 ? CLASS_COLORS[i] : l === 0 ? '#a78bfa' : '#7dd3fc';
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 9, 20, .85)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.22 + a * 0.78;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (l === LAYERS.length - 1) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 3.2, 0, Math.PI * 2);
          ctx.strokeStyle = color + '66';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    // ملصقات الطبقات
    ctx.font = '600 10px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(160,176,214,.85)';
    ctx.textAlign = 'center';
    nodes[0].forEach(() => {});
    ctx.textAlign = 'start';
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  /* ---------- بطاقات الاحتمالات ---------- */
  outEl.innerHTML = CLASS_COLORS.map(
    (c, i) => `
    <div class="prob" data-i="${i}">
      <div class="prob__top">
        <span class="prob__name"><em style="background:${c}"></em>${ui.classes[i]}</span>
        <span class="prob__val" data-v>25%</span>
      </div>
      <div class="prob__bar"><i style="background:linear-gradient(90deg,${c},${chapter.accent2})" data-bar></i></div>
    </div>`
  ).join('');

  const probNodes = Array.from(outEl.querySelectorAll('.prob'));

  function updateProbUI() {
    let best = 0;
    for (let i = 1; i < 4; i++) if (probs[i] > probs[best]) best = i;
    probNodes.forEach((node, i) => {
      node.classList.toggle('is-top', i === best);
      const v = node.querySelector('[data-v]');
      const bar = node.querySelector('[data-bar]');
      const pct = Math.round(probs[i] * 100);
      if (v.textContent !== `${pct}%`) v.textContent = `${pct}%`;
      bar.style.width = `${clamp(probs[i] * 100, 1, 100)}%`;
    });
  }

  const badges = {
    epoch: host.querySelector('[data-m="epoch"]'),
    acc: host.querySelector('[data-m="acc"]'),
    loss: host.querySelector('[data-m="loss"]'),
  };

  function updateBadges() {
    badges.epoch.textContent = `${ui.epoch}: ${epoch}`;
    badges.acc.textContent = `${ui.accuracy}: ${Math.round(acc * 100)}%`;
    badges.loss.textContent = `${ui.loss}: ${loss.toFixed(3)}`;
  }

  /* ---------- التفاعل ---------- */
  function toFieldCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const L = layout();
    const f = L.field;
    const x = (clientX - rect.left - f.x) / f.w;
    const y = 1 - (clientY - rect.top - f.y) / f.h;
    return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
  }

  function insideField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const f = layout().field;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h;
  }

  let dragging = null;

  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      const p = toFieldCoords(e.clientX, e.clientY);
      dragging.x = p.x;
      dragging.y = p.y;
      needsField = true;
      refreshProbe(p.x, p.y);
      render();
      return;
    }
    if (insideField(e.clientX, e.clientY)) {
      const p = toFieldCoords(e.clientX, e.clientY);
      refreshProbe(p.x, p.y);
      render();
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (!insideField(e.clientX, e.clientY)) return;
    const p = toFieldCoords(e.clientX, e.clientY);
    let best = null;
    let bestD = 0.035;
    for (const d of data) {
      const dist = Math.hypot(d.x - p.x, d.y - p.y);
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    if (best) {
      dragging = best;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    }
  });

  const endDrag = () => {
    dragging = null;
    canvas.style.cursor = 'crosshair';
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  let needsField = true;
  let frame = 0;

  function refreshProbe(x, y) {
    probe = { x, y, on: true };
    probs = Array.from(forward(x, y));
    updateProbUI();
  }

  function render() {
    if (needsField) {
      renderField();
      needsField = false;
    }
    draw();
  }

  let onScreen = true;

  function loop() {
    frame++;
    if (!onScreen) {
      raf = requestAnimationFrame(loop);
      return;
    }
    if (playing) {
      trainEpoch();
      needsField = true;
      updateBadges();
      if (probe.on) {
        probs = Array.from(forward(probe.x, probe.y));
        updateProbUI();
      }
      if (epoch % 3 === 0) render();
      else draw();
      if (acc >= 0.995 && loss < 0.06 && epoch > 60) {
        playing = false;
        playBtn.textContent = ui.play;
      }
    } else if (frame % 30 === 0) {
      // إعادة رسم دورية لطيفة (تفادي إجهاد المعالج)
      render();
    }
    raf = requestAnimationFrame(loop);
  }

  /* ---------- الأزرار ---------- */
  const playBtn = host.querySelector('[data-play]');
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? ui.pause : ui.play;
    playBtn.classList.toggle('btn--primary', !playing);
    playBtn.classList.toggle('btn--ghost', playing);
  });

  host.querySelector('[data-step]').addEventListener('click', () => {
    trainEpoch();
    needsField = true;
    updateBadges();
    if (probe.on) {
      probs = Array.from(forward(probe.x, probe.y));
      updateProbUI();
    }
    render();
  });

  host.querySelector('[data-reset]').addEventListener('click', () => {
    newData();
    for (let l = 0; l < W.length; l++) {
      const [nIn] = shapes[l];
      for (let i = 0; i < W[l].length; i++) W[l][i] = randn() * Math.sqrt(2 / nIn);
      vel[l].fill(0);
      for (let i = 0; i < bias[l].length; i++) bias[l][i] = randn() * 0.1;
      velB[l].fill(0);
    }
    epoch = 0;
    loss = 1.386;
    acc = 0;
    needsField = true;
    updateBadges();
    render();
  });

  const wBtn = host.querySelector('[data-weights]');
  wBtn.addEventListener('click', () => {
    showWeights = !showWeights;
    wBtn.textContent = showWeights ? ui.weightsOn : ui.weightsOff;
    wBtn.classList.toggle('is-on', showWeights);
    draw();
  });
  wBtn.classList.add('is-on');

  const lrInput = host.querySelector('[data-lr]');
  const lrVal = host.querySelector('[data-lr-val]');
  lrInput.addEventListener('input', () => {
    lr = Number(lrInput.value);
    lrVal.textContent = lr.toFixed(2);
    const pct = ((lr - 0.02) / 0.88) * 100;
    lrInput.style.setProperty('--fill', `${pct}%`);
  });
  lrInput.dispatchEvent(new Event('input'));

  /* ---------- تشغيل ---------- */
  newData();
  fit();
  renderField();
  updateBadges();
  refreshProbe(0.5, 0.5);
  updateProbUI();
  draw();

  canvas.style.cursor = 'crosshair';
  const ro = new ResizeObserver(() => {
    fit();
    draw();
  });
  ro.observe(canvas);

  let raf = requestAnimationFrame(loop);
  const stopVisible = observeVisibility(canvas, (visible) => {
    onScreen = visible;
    if (visible) {
      needsField = true;
      render();
    }
  });
  const themeMo = new MutationObserver(() => {
    needsField = true;
    render();
  });
  themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // بدء التدريب تلقائيًا بعد لحظة — يعطي إيحاء "حياة"
  setTimeout(() => {
    if (document.body.contains(canvas)) {
      playing = true;
      playBtn.textContent = ui.pause;
      playBtn.classList.remove('btn--primary');
      playBtn.classList.add('btn--ghost');
    }
  }, 1400);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    themeMo.disconnect();
    stopVisible();
  };
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function icon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="5" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="12" cy="12" r="2.4"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7.6 10 11M7 16.4 10 13M14 10.6l3-3.2M14 13.4l3 3.2"/></svg>`;
}
