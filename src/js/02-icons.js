// =====================================================================
// Icônes dessinées (canvas) : aplats + contour encré
// =====================================================================
const CROP_COL = { gombo: '#6fbe3f', patate: '#a24b8a', tomate: '#e8402e', piment: '#e2362f', giraumon: '#f0902a', ananas: '#f6c026', ganja: '#2fa84f' };
const iconCache = {};
function icon(id, tier = 0) {
  const key = id + ':' + tier;
  if (iconCache[key]) return iconCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const INK = '#241a2e';
  x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 3.5; x.strokeStyle = INK;
  const fs = f => { x.fillStyle = f; x.fill(); x.stroke(); };
  const stick = (x1, y1, x2, y2, w, col) => {
    x.save(); x.strokeStyle = INK; x.lineWidth = w + 5; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
    x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); x.restore();
  };
  const ell = (cx, cy, rx, ry, col, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); fs(col); };
  const shine = (cx, cy, r) => { x.save(); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(cx, cy, r, r * 0.6, -0.6, 0, Math.PI * 2); x.fill(); x.restore(); };
  const leaves = (cx, cy, col = '#2fa84f') => { ell(cx - 7, cy, 5, 10, col, -0.5); ell(cx + 7, cy, 5, 10, col, 0.5); ell(cx, cy - 4, 5, 10, '#4dc760'); };
  const dots = (pts, col, r = 1.6) => { x.save(); x.fillStyle = col; for (const [a, b] of pts) { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); } x.restore(); };
  const it = ITEMS[id];
  const metal = ['#aeb8c6', '#dfe6ee', '#f6c026'][tier];
  const wood = ['#b07a48', '#8f9aa8', '#d9a21b'][tier];
  if (id === 'hoe') {
    stick(16, 54, 44, 16, 5, wood);
    x.beginPath(); x.moveTo(36, 9); x.lineTo(56, 13); x.lineTo(52, 27); x.lineTo(41, 19); x.closePath(); fs(metal);
  } else if (id === 'can') {
    const body = ['#2fb6a7', '#7fa5c4', '#f6c026'][tier];
    stick(42, 36, 57, 22, 5, body);
    x.beginPath(); x.arc(28, 26, 11, Math.PI, 0); x.save(); x.lineWidth = 8; x.stroke(); x.strokeStyle = '#e2362f'; x.lineWidth = 3.5; x.stroke(); x.restore();
    x.beginPath(); x.roundRect(12, 24, 32, 28, 7); fs(body); shine(20, 32, 5);
    dots([[22, 44], [28, 44], [34, 44]], '#e2362f', 2);
  } else if (id === 'rod') {
    stick(10, 56, 50, 9, 4, ['#c99a5a', '#4fb0a8', '#f6c026'][tier]);
    x.save(); x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(50, 9); x.quadraticCurveTo(58, 28, 54, 46); x.stroke(); x.restore();
    x.beginPath(); x.arc(54, 48, 4.5, 0, Math.PI * 2); fs('#e2362f');
    x.beginPath(); x.arc(20, 45, 6, 0, Math.PI * 2); fs('#8d96a3');
  } else if (it && it.kind === 'seed') {
    x.beginPath(); x.roundRect(14, 9, 36, 47, 5); fs('#f2dfae');
    x.save(); x.fillStyle = '#e2362f'; x.fillRect(16, 11, 32, 5); x.fillStyle = '#f6c026'; x.fillRect(16, 16, 32, 4); x.fillStyle = '#2fa84f'; x.fillRect(16, 20, 32, 4); x.restore();
    ell(32, 40, 10, 10, CROP_COL[it.crop]); ell(32, 30, 4, 5, '#2fa84f');
  } else if (id === 'gombo') {
    for (const [dx, rot] of [[-9, -0.25], [0, 0], [9, 0.25]]) { x.beginPath(); x.moveTo(32 + dx - 5, 18); x.quadraticCurveTo(32 + dx, 14, 32 + dx + 5, 18); x.lineTo(32 + dx * 1.3 + 1, 56); x.closePath(); fs('#6fbe3f'); }
    ell(32, 17, 14, 4, '#2fa84f');
  } else if (id === 'patate') {
    leaves(34, 15, '#2fa84f'); ell(32, 40, 19, 13, '#a24b8a', -0.35); shine(24, 34, 5);
    x.save(); x.strokeStyle = 'rgba(36,26,46,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(38, 36); x.lineTo(44, 42); x.stroke(); x.restore();
  } else if (id === 'tomate') {
    ell(32, 38, 18, 16, '#e8402e'); shine(24, 32, 6);
    x.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 5; x.lineTo(32 + Math.cos(a) * 11, 23 + Math.sin(a) * 6); x.lineTo(32 + Math.cos(a + 0.6) * 4, 23 + Math.sin(a + 0.6) * 3); } x.closePath(); fs('#2fa84f');
  } else if (id === 'piment') {
    x.beginPath(); x.moveTo(20, 18); x.quadraticCurveTo(46, 18, 46, 40); x.quadraticCurveTo(46, 54, 36, 58); x.quadraticCurveTo(42, 44, 36, 34); x.quadraticCurveTo(28, 26, 20, 26); x.closePath(); fs('#e2362f');
    shine(40, 38, 4); stick(20, 22, 14, 12, 4, '#2fa84f');
  } else if (id === 'giraumon') {
    x.beginPath(); x.roundRect(29, 8, 7, 12, 3); fs('#7a5136');
    ell(32, 38, 24, 18, '#f0902a');
    x.save(); x.strokeStyle = 'rgba(36,26,46,.45)'; x.lineWidth = 2.5; for (const dx of [-11, 0, 11]) { x.beginPath(); x.ellipse(32 + dx * 0.6, 38, 6 + Math.abs(dx) * 0.4, 17, 0, 0, Math.PI * 2); x.stroke(); } x.restore();
    shine(20, 31, 5);
  } else if (id === 'ananas') {
    for (const [a, h] of [[-0.6, 22], [-0.25, 28], [0, 31], [0.25, 28], [0.6, 22]]) { x.beginPath(); x.moveTo(32, 26); x.lineTo(32 + Math.sin(a) * h * 0.8, 26 - Math.cos(a) * h * 0.9); x.lineTo(32 + Math.sin(a) * 3 + 4, 26); x.closePath(); fs('#2fa84f'); }
    ell(32, 42, 15, 17, '#f6c026');
    x.save(); x.strokeStyle = 'rgba(180,90,10,.7)'; x.lineWidth = 2; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(32 + k * 6 - 10, 30); x.lineTo(32 + k * 6 + 10, 54); x.stroke(); x.beginPath(); x.moveTo(32 + k * 6 + 10, 30); x.lineTo(32 + k * 6 - 10, 54); x.stroke(); } x.restore();
  } else if (id === 'ganja') {
    for (const a of [-1.25, -0.8, -0.4, 0, 0.4, 0.8, 1.25]) {
      const len = 22 - Math.abs(a) * 7, ex = 32 + Math.sin(a) * len, ey = 38 - Math.cos(a) * len;
      x.beginPath(); x.moveTo(32, 40); x.quadraticCurveTo(32 + Math.sin(a) * len * 0.5 + 5, 38 - Math.cos(a) * len * 0.5, ex, ey); x.quadraticCurveTo(32 + Math.sin(a) * len * 0.5 - 5, 38 - Math.cos(a) * len * 0.5, 32, 40); fs('#2fa84f');
    }
    stick(32, 40, 32, 58, 3, '#7a5136');
  } else if (it && it.kind === 'fish') {
    const col = it.color;
    if (id === 'janga') {
      ell(32, 36, 9, 17, col, 0); for (const s of [-1, 1]) { x.beginPath(); x.moveTo(32 + s * 8, 26); x.lineTo(32 + s * 18, 14); x.lineTo(32 + s * 12, 22); x.lineTo(32 + s * 21, 22); x.lineTo(32 + s * 11, 30); x.closePath(); fs(col); }
      x.beginPath(); x.moveTo(26, 52); x.lineTo(32, 60); x.lineTo(38, 52); x.closePath(); fs(col); dots([[29, 22], [35, 22]], INK, 2);
    } else {
      const long = id === 'anguille' ? 1.25 : id === 'marlin' ? 1.15 : 1, hh = id === 'anguille' ? 6 : 11;
      x.beginPath(); x.moveTo(46, 32); x.lineTo(60, 20); x.lineTo(56, 32); x.lineTo(60, 44); x.closePath(); fs(col);
      if (id !== 'anguille') { x.beginPath(); x.moveTo(22, 22); x.quadraticCurveTo(32, id === 'marlin' ? 6 : 12, 40, 22); fs(col); }
      ell(29, 32, 20 * long, hh, col); shine(24, 28, 6);
      if (id === 'marlin') { x.beginPath(); x.moveTo(8, 32); x.lineTo(-4, 32); x.stroke(); stick(11, 32, 2, 32, 2, '#c3ccd4'); }
      if (id === 'perroquet') { x.save(); x.globalAlpha = .9; for (const [px, pc] of [[22, '#e2362f'], [30, '#f6c026'], [38, '#2fa84f']]) { x.fillStyle = pc; x.fillRect(px, 24, 5, 17); } x.restore(); ell(29, 32, 20, 11, 'rgba(0,0,0,0)'); }
      if (id === 'mahi') { x.save(); x.fillStyle = '#2fa84f'; x.beginPath(); x.ellipse(29, 26, 18, 5, 0, Math.PI, 0); x.fill(); x.restore(); }
      x.beginPath(); x.arc(17, 30, 2.6, 0, Math.PI * 2); x.fillStyle = INK; x.fill();
      x.save(); x.strokeStyle = 'rgba(36,26,46,.35)'; x.lineWidth = 2; x.beginPath(); x.arc(28, 32, 7, -1.2, 1.2); x.stroke(); x.restore();
    }
  } else if (id === 'oeuf' || id === 'oeuf_or') {
    ell(32, 36, 15, 19, id === 'oeuf' ? '#fff6e4' : '#f6c026'); shine(26, 28, 5);
    if (id === 'oeuf_or') { dots([[40, 44], [36, 50]], '#fff6c9', 2); }
  } else if (id === 'lait' || id === 'lait_creme') {
    x.beginPath(); x.roundRect(20, 20, 24, 36, 5); fs('#fbfbf7'); x.beginPath(); x.roundRect(24, 8, 16, 14, 3); fs(id === 'lait' ? '#e2362f' : '#f6c026');
    x.save(); x.fillStyle = id === 'lait' ? '#17a9c7' : '#ffb7d4'; x.fillRect(22, 32, 20, 14); x.restore();
  } else if (id === 'coco') {
    ell(32, 36, 20, 19, '#6a4426'); shine(24, 28, 5); dots([[26, 34], [38, 34], [32, 42]], INK, 2.6);
  } else if (id === 'coquillage') {
    x.beginPath(); x.moveTo(8, 50); x.quadraticCurveTo(10, 14, 38, 12); x.quadraticCurveTo(58, 16, 54, 44); x.quadraticCurveTo(44, 58, 8, 50); x.closePath(); fs('#ffb7c9');
    x.save(); x.strokeStyle = 'rgba(36,26,46,.4)'; x.lineWidth = 2; x.beginPath(); x.arc(30, 36, 8, 0, 4.8); x.stroke(); x.beginPath(); x.arc(30, 36, 16, 0.5, 5); x.stroke(); x.restore(); shine(40, 22, 4);
  } else if (id === 'jus_coco') {
    x.beginPath(); x.moveTo(12, 24); x.lineTo(52, 24); x.quadraticCurveTo(50, 56, 32, 58); x.quadraticCurveTo(14, 56, 12, 24); fs('#6a4426');
    ell(32, 24, 20, 5, '#f4efe2'); stick(36, 22, 46, 4, 3, '#e2362f');
    x.beginPath(); x.moveTo(48, 4); x.lineTo(58, 10); x.lineTo(50, 14); x.closePath(); fs('#f6c026');
  } else if (id === 'plantain') {
    for (const [px, py] of [[18, 20], [38, 16], [24, 40], [42, 38]]) ell(px + 6, py + 6, 11, 8, '#f6c026');
    dots([[22, 24], [42, 20], [28, 44], [46, 42]], '#b86a10', 1.6);
  } else if (id === 'jerk') {
    ell(26, 30, 17, 15, '#a8501f', -0.4); shine(20, 24, 5); stick(36, 40, 52, 56, 5, '#f4efe2'); ell(54, 58, 5, 4, '#f4efe2');
    dots([[20, 32], [28, 26], [30, 36]], '#5a2c0e', 2);
  } else if (id === 'fourrage') {
    x.beginPath(); x.roundRect(10, 24, 44, 30, 8); fs('#e8c657');
    x.save(); x.strokeStyle = 'rgba(120,80,10,.6)'; x.lineWidth = 2; for (const k of [20, 28, 36, 44]) { x.beginPath(); x.moveTo(k, 28); x.lineTo(k + 4, 50); x.stroke(); } x.restore();
    x.save(); x.strokeStyle = '#e2362f'; x.lineWidth = 4; x.beginPath(); x.moveTo(10, 38); x.lineTo(54, 38); x.stroke(); x.restore();
  } else if (id === 'machette') {
    stick(14, 54, 26, 42, 6, wood);
    x.beginPath(); x.moveTo(24, 40); x.quadraticCurveTo(44, 10, 58, 6); x.quadraticCurveTo(52, 26, 30, 46); x.closePath(); fs(metal); shine(46, 18, 4);
  } else if (id === 'pioche') {
    stick(16, 56, 40, 20, 5, wood);
    x.beginPath(); x.moveTo(14, 22); x.quadraticCurveTo(38, 4, 60, 22); x.lineTo(54, 26); x.quadraticCurveTo(38, 14, 22, 28); x.closePath(); fs(metal);
  } else if (id === 'bois') {
    for (const [y, l] of [[44, 0], [30, 6], [16, 2]]) { x.beginPath(); x.roundRect(8 + l, y, 44, 14, 7); fs('#a8774e'); ell(52 + l, y + 7, 5, 7, '#e8c79a'); }
  } else if (id === 'pierre') {
    x.beginPath(); x.moveTo(10, 46); x.lineTo(16, 24); x.lineTo(34, 14); x.lineTo(52, 22); x.lineTo(56, 44); x.lineTo(38, 54); x.closePath(); fs('#a9a39b'); shine(26, 26, 5);
  } else if (id === 'fibre') {
    x.save(); x.strokeStyle = INK; x.lineWidth = 7; for (const a of [-0.5, -0.2, 0.1, 0.4]) { x.beginPath(); x.moveTo(32, 58); x.quadraticCurveTo(32 + a * 30, 30, 32 + a * 50, 8); x.stroke(); } x.strokeStyle = '#8fc04a'; x.lineWidth = 3.5; for (const a of [-0.5, -0.2, 0.1, 0.4]) { x.beginPath(); x.moveTo(32, 58); x.quadraticCurveTo(32 + a * 30, 30, 32 + a * 50, 8); x.stroke(); } x.restore();
    x.beginPath(); x.roundRect(24, 40, 16, 8, 3); fs('#e2362f');
  } else if (id === 'quartz') {
    x.beginPath(); x.moveTo(32, 6); x.lineTo(48, 24); x.lineTo(42, 56); x.lineTo(22, 56); x.lineTo(16, 24); x.closePath(); fs('#ff9fc0');
    x.save(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(32, 10); x.lineTo(30, 50); x.stroke(); x.restore();
  } else if (id === 'planche') {
    for (const y of [16, 30, 44]) { x.beginPath(); x.roundRect(6, y, 52, 11, 3); fs('#d39a5f'); }
    dots([[14, 21], [50, 21], [14, 35], [50, 35], [14, 49], [50, 49]], '#5b3a2a', 1.8);
  } else if (id === 'corde') {
    x.save(); x.strokeStyle = INK; x.lineWidth = 10; x.beginPath(); x.arc(32, 34, 18, 0.2, Math.PI * 1.9); x.stroke(); x.strokeStyle = '#e8c79a'; x.lineWidth = 6; x.stroke(); x.restore();
    x.save(); x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.arc(32, 34, 8, 0, Math.PI * 2); x.stroke(); x.strokeStyle = '#d6b07a'; x.lineWidth = 3; x.stroke(); x.restore();
  } else if (id === 'engrais') {
    x.beginPath(); x.moveTo(14, 18); x.lineTo(50, 18); x.lineTo(54, 56); x.lineTo(10, 56); x.closePath(); fs('#8a5a3a');
    ell(32, 18, 18, 5, '#5b3a2a'); ell(32, 40, 9, 9, '#6a4426'); x.beginPath(); x.moveTo(32, 30); x.lineTo(40, 22); x.lineTo(42, 32); x.closePath(); fs('#2fa84f');
  } else if (id === 'arroseur') {
    x.beginPath(); x.roundRect(20, 46, 24, 10, 3); fs('#8a5a3a'); stick(32, 46, 32, 22, 4, '#7fa5c4');
    x.beginPath(); x.roundRect(14, 16, 36, 8, 4); fs('#2fb6a7');
    x.save(); x.strokeStyle = '#17a9c7'; x.lineWidth = 3; for (const a of [-1, 1]) { x.beginPath(); x.moveTo(32 + a * 18, 20); x.quadraticCurveTo(32 + a * 30, 18, 32 + a * 30, 34); x.stroke(); } x.restore();
  } else if (id === 'appat') {
    x.beginPath(); x.roundRect(12, 22, 40, 32, 6); fs('#c9a46a'); x.beginPath(); x.roundRect(10, 16, 44, 10, 4); fs('#e2362f');
    x.save(); x.strokeStyle = '#ff7aa0'; x.lineWidth = 5; x.beginPath(); x.moveTo(20, 40); x.quadraticCurveTo(30, 30, 38, 42); x.quadraticCurveTo(44, 50, 50, 36); x.stroke(); x.restore();
  } else if (id === 'kit_jetee') {
    for (const [y, r] of [[34, -0.2], [26, 0.15]]) { x.save(); x.translate(32, y); x.rotate(r); x.beginPath(); x.roundRect(-26, -6, 52, 12, 3); fs('#d39a5f'); x.restore(); }
    x.save(); x.strokeStyle = INK; x.lineWidth = 7; x.beginPath(); x.moveTo(16, 50); x.lineTo(48, 18); x.stroke(); x.strokeStyle = '#e8c79a'; x.lineWidth = 3.5; x.stroke(); x.restore();
    x.beginPath(); x.roundRect(36, 40, 18, 16, 3); fs('#aeb8c6');
  } else if (id === 'jus_ananas') {
    x.beginPath(); x.moveTo(16, 18); x.lineTo(48, 18); x.lineTo(44, 58); x.lineTo(20, 58); x.closePath(); fs('#f6c026'); x.save(); x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(22, 24, 6, 26); x.restore();
    stick(38, 18, 46, 4, 3, '#2fa84f'); ell(24, 16, 8, 4, '#2fa84f', -0.4);
  } else if (id === 'poisson_grille') {
    ell(32, 44, 26, 10, '#fbf6ec'); ell(30, 38, 18, 9, '#c26a2e'); x.beginPath(); x.moveTo(46, 38); x.lineTo(58, 30); x.lineTo(58, 46); x.closePath(); fs('#c26a2e');
    x.save(); x.strokeStyle = '#5a2c0e'; x.lineWidth = 2.5; for (const k of [22, 30, 38]) { x.beginPath(); x.moveTo(k, 31); x.lineTo(k + 4, 45); x.stroke(); } x.restore(); ell(48, 50, 4, 3, '#e2362f');
  } else if (id === 'gateau_coco') {
    x.beginPath(); x.roundRect(10, 30, 44, 24, 6); fs('#f4e3c3'); x.beginPath(); x.roundRect(8, 24, 48, 12, 6); fs('#fffaf0');
    dots([[16, 28], [24, 31], [34, 28], [44, 31], [50, 28]], '#c9a46a', 1.8); ell(32, 18, 6, 6, '#e2362f'); stick(32, 12, 36, 6, 2, '#2fa84f');
  } else if (id === 'soupe') {
    x.beginPath(); x.moveTo(8, 30); x.lineTo(56, 30); x.quadraticCurveTo(54, 58, 32, 58); x.quadraticCurveTo(10, 58, 8, 30); fs('#17a9c7'); ell(32, 30, 24, 6, '#f0902a');
    dots([[24, 30], [36, 29], [42, 31]], '#2fa84f', 2.4); x.save(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2.5; for (const k of [24, 34, 44]) { x.beginPath(); x.moveTo(k, 22); x.quadraticCurveTo(k - 4, 16, k, 10); x.stroke(); } x.restore();
  } else if (id.startsWith('hat_') || id.startsWith('shirt_') || id.startsWith('gl_')) {
    drawCosm(x, id, { fs, ell, shine, stick, INK });
  } else {
    ell(32, 32, 16, 16, '#c0c0c0');
  }
  return (iconCache[key] = c.toDataURL());
}
function drawCosm(x, id, h) {
  const { fs, ell, INK } = h;
  const band = (x0, y0, w, hh, cols) => { x.save(); const n = cols.length; cols.forEach((c, k) => { x.fillStyle = c; x.fillRect(x0, y0 + k * hh / n, w, hh / n + 0.5); }); x.restore(); };
  if (id === 'hat_none') { ell(32, 34, 14, 16, '#f1c9a5'); x.save(); x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.moveTo(12, 54); x.lineTo(52, 12); x.stroke(); x.restore(); }
  else if (id === 'hat_straw') { ell(32, 44, 28, 8, '#ecc86a'); x.beginPath(); x.roundRect(18, 20, 28, 26, 10); fs('#ecc86a'); x.save(); x.fillStyle = '#e2362f'; x.fillRect(19, 38, 26, 6); x.restore(); }
  else if (id === 'hat_cap') { x.beginPath(); x.arc(30, 40, 20, Math.PI, 0); x.lineTo(60, 40); x.lineTo(14, 44); x.closePath(); fs('#2b3f6b'); x.beginPath(); x.roundRect(36, 38, 24, 6, 3); fs('#2b3f6b'); }
  else if (id === 'hat_bandana') { x.beginPath(); x.arc(32, 36, 22, Math.PI * 1.05, Math.PI * 1.95); x.lineTo(32, 56); x.closePath(); fs('#e2362f'); x.save(); x.fillStyle = '#fff'; for (const [a, b] of [[24, 30], [34, 26], [40, 36], [30, 40]]) { x.beginPath(); x.arc(a, b, 2, 0, 7); x.fill(); } x.restore(); }
  else if (id === 'hat_tam') { x.beginPath(); x.ellipse(32, 36, 26, 20, 0, Math.PI, 0); x.lineTo(54, 46); x.lineTo(10, 46); x.closePath(); fs('#2fa84f'); band(11, 28, 42, 12, ['#e2362f', '#f6c026']); x.beginPath(); x.ellipse(32, 36, 26, 20, 0, Math.PI, 0); x.lineTo(54, 46); x.lineTo(10, 46); x.closePath(); x.stroke(); }
  else if (id === 'hat_crown') { for (let k = 0; k < 7; k++) ell(10 + k * 7.5, 38 + (k % 2) * 3, 6, 6, ['#ff7ac8', '#f6c026', '#fff', '#e2362f'][k % 4]); x.save(); x.strokeStyle = '#2fa84f'; x.lineWidth = 4; x.beginPath(); x.moveTo(8, 44); x.lineTo(56, 44); x.stroke(); x.restore(); }
  else if (id.startsWith('shirt_')) {
    const col = { shirt_tank: '#f6c026', shirt_white: '#fbf6ec', shirt_flower: '#17a9c7', shirt_surf: '#2f8fc0', shirt_rasta: '#2fa84f' }[id];
    x.beginPath(); x.moveTo(12, 16); x.lineTo(24, 10); x.quadraticCurveTo(32, 20, 40, 10); x.lineTo(52, 16); x.lineTo(46, 28); x.lineTo(44, 28); x.lineTo(44, 56); x.lineTo(20, 56); x.lineTo(20, 28); x.lineTo(18, 28); x.closePath(); fs(col);
    if (id === 'shirt_rasta') band(20, 28, 24, 28, ['#e2362f', '#f6c026', '#2fa84f']);
    if (id === 'shirt_flower') { x.save(); for (const [a, b, c] of [[27, 34, '#ff7ac8'], [37, 44, '#f6c026'], [28, 50, '#fff'], [38, 32, '#e2362f']]) { x.fillStyle = c; x.beginPath(); x.arc(a, b, 3.2, 0, 7); x.fill(); } x.restore(); }
    if (id === 'shirt_surf') { x.save(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(21, 38); x.quadraticCurveTo(26, 32, 32, 38); x.quadraticCurveTo(38, 44, 43, 38); x.stroke(); x.restore(); }
  } else if (id === 'gl_none') { x.save(); x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.moveTo(12, 52); x.lineTo(52, 12); x.stroke(); x.restore(); }
  else if (id === 'gl_round') { x.beginPath(); x.arc(20, 34, 11, 0, 7); fs('#241a2e'); x.beginPath(); x.arc(44, 34, 11, 0, 7); fs('#241a2e'); x.save(); x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.moveTo(31, 32); x.lineTo(33, 32); x.stroke(); x.restore(); }
  else if (id === 'gl_aviator') { x.beginPath(); x.moveTo(8, 26); x.quadraticCurveTo(22, 22, 30, 28); x.quadraticCurveTo(28, 48, 18, 48); x.quadraticCurveTo(8, 44, 8, 26); fs('#e2362f'); x.beginPath(); x.moveTo(56, 26); x.quadraticCurveTo(42, 22, 34, 28); x.quadraticCurveTo(36, 48, 46, 48); x.quadraticCurveTo(56, 44, 56, 26); fs('#e2362f'); }
}
const WX_SVG = {
  sun: '<circle cx="16" cy="16" r="6" fill="#f6c026" stroke="#241a2e" stroke-width="2"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="16" y1="3" x2="16" y2="6.5" stroke="#241a2e" stroke-width="2.4" stroke-linecap="round" transform="rotate(${a} 16 16)"/>`).join(''),
  cloud: '<circle cx="12" cy="13" r="5" fill="#f6c026" stroke="#241a2e" stroke-width="2"/><path d="M9 25h15a5 5 0 0 0 0-10 7 7 0 0 0-13.5-1A5.5 5.5 0 0 0 9 25z" fill="#fff" stroke="#241a2e" stroke-width="2" stroke-linejoin="round"/>',
  rain: '<path d="M8 19h16a5 5 0 0 0 0-10 7 7 0 0 0-13.5-1A5.5 5.5 0 0 0 8 19z" fill="#cfe2ee" stroke="#241a2e" stroke-width="2" stroke-linejoin="round"/>' + [[11, 22], [16, 24], [21, 22]].map(([a, b]) => `<line x1="${a}" y1="${b}" x2="${a - 2}" y2="${b + 5}" stroke="#17a9c7" stroke-width="2.4" stroke-linecap="round"/>`).join(''),
  storm: '<path d="M8 18h16a5 5 0 0 0 0-10 7 7 0 0 0-13.5-1A5.5 5.5 0 0 0 8 18z" fill="#8b93a8" stroke="#241a2e" stroke-width="2" stroke-linejoin="round"/><path d="M17 18l-5 7h4l-2 5 7-8h-4l2-4z" fill="#f6c026" stroke="#241a2e" stroke-width="1.6" stroke-linejoin="round"/>',
};
const heartSVG = full => `<svg class="heart" viewBox="0 0 14 13"><path d="M7 12S1 8 1 4.2A3.2 3.2 0 0 1 7 3a3.2 3.2 0 0 1 6 1.2C13 8 7 12 7 12z" fill="${full ? '#e2362f' : '#f3dcc0'}" stroke="#241a2e" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const heartsRow = n => `<span class="hearts" aria-label="${n} cœurs sur 10">${Array.from({ length: 10 }, (_, k) => heartSVG(k < n)).join('')}</span>`;
