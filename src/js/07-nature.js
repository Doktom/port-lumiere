// =====================================================================
// Végétation tropicale, faune et météo visuelle
// =====================================================================
const ENV = { night: 0, rain: 0, storm: 0, cloud: 0, rainbow: 0 };
function makeFrondGeo(len = 1, segs = 12, wid = 0.3, serr = 0.55, rise = 0.55, fall = 1.0) {
  const P = [], I = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const y = rise * t - fall * t * t;
    const taper = Math.pow(1 - t, 0.65) * (0.4 + 0.6 * Math.min(1, t * 6));
    const w = wid * taper * ((i % 2) ? 1 : serr);
    const z = t * len;
    P.push(-w, y - 0.35 * w, z, 0, y, z, w, y - 0.35 * w, z);
  }
  for (let i = 0; i < segs; i++) { const a = i * 3, b = (i + 1) * 3; I.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals(); return geo;
}
let trunkB, frondB, bananaB, coconB, leafB, tuftB, flowerB, rockB, padB, reedB, shellB;
const FR_COLS = ['#34a844', '#43b84f', '#2b9a40', '#58c552'];
const FOLIAGE = { leaf: null };
function foliageTint(c) { for (const m of swayMats) m.color.copy(m.userData.base).multiply(c); if (FOLIAGE.leaf) FOLIAGE.leaf.color.copy(c); }

const FORAGE_PALMS = [[5.6, 9.2], [5.6, 43.6], [32.4, 43.6], [32.6, 13.6], [35.8, 30], [36.6, 19], [59.5, 52.4], [69.5, 52.2]];
const forage = [];
const shellSpots = [];

function addPalm(x, z, s = 1, o = {}) {
  const far = !!o.far, segN = far ? 3 : 5;
  const H = (2.5 + rnd() * 1.4) * s, a = rnd() * 6.283, lean = (0.35 + rnd() * 0.9) * s;
  let px = x, py = 0, pz = z;
  for (let k = 1; k <= segN; k++) {
    const t = k / segN, cx = x + Math.cos(a) * lean * t * t, cy = H * t, cz = z + Math.sin(a) * lean * t * t;
    trunkB.putDir(px, py, pz, cx, cy, cz, (0.15 - 0.07 * t) * s, k % 2 ? '#a8774e' : '#8e5f3b'); px = cx; py = cy; pz = cz;
  }
  const n = far ? 7 : 9;
  for (let k = 0; k < n; k++) {
    const yaw = k / n * Math.PI * 2 + rnd() * 0.4, pitch = -0.45 + rnd() * 0.65, L = (1.35 + rnd() * 0.5) * s;
    frondB.put(px, py, pz, L, L, L, yaw, FR_COLS[(rnd() * 4) | 0], pitch);
  }
  if (!far) {
    for (let k = 0; k < 3; k++) coconB.put(px + (rnd() - 0.5) * 0.3, py - 0.1, pz + (rnd() - 0.5) * 0.3, 0.1, 0.1, 0.1, 0, '#6a4a2a');
    solidBox(x - 0.2, z - 0.2, x + 0.2, z + 0.2);
  }
  return [px, py, pz];
}
function addBanana(x, z, s = 1, far = false) {
  const H = 0.9 * s;
  trunkB.putDir(x, 0, z, x, H, z, 0.11 * s, '#86ad55');
  const n = far ? 5 : 6;
  for (let k = 0; k < n; k++) bananaB.put(x, H, z, (1.05 + rnd() * 0.4) * s, (1.05 + rnd() * 0.4) * s, (1.05 + rnd() * 0.4) * s, k / n * 6.283 + rnd() * 0.5, ['#5fc24a', '#6fcf55', '#4faf44'][k % 3], -0.7 + rnd() * 0.35);
  if (!far) { for (let k = 0; k < 5; k++) coconB.put(x + 0.14 + k * 0.03, H - 0.1 - k * 0.04, z + 0.04, 0.06, 0.17, 0.06, 0, '#f6d03a', 0.2); solidBox(x - 0.22, z - 0.22, x + 0.22, z + 0.22); }
}
function addMango(x, z, s = 1, far = false) {
  trunkB.putDir(x, 0, z, x + 0.08, 1.3 * s, z, 0.17 * s, '#7a5136');
  const g = ['#2f8a3c', '#3a9a44', '#2b7d38'][(rnd() * 3) | 0];
  for (const [dx, dy, dz, r] of [[0, 2.0, 0, 0.95], [0.6, 1.65, 0.2, 0.65], [-0.55, 1.7, -0.1, 0.7], [0.1, 1.55, -0.55, 0.62], [0, 2.55, 0.1, 0.55]]) leafB.put(x + dx * s, dy * s, z + dz * s, r * s, r * 0.8 * s, r * s, rnd() * 6, g);
  if (!far) { for (let k = 0; k < 5; k++) coconB.put(x + (rnd() - 0.5) * 1.3 * s, 1.6 * s + rnd() * 0.5, z + (rnd() - 0.5) * 1.3 * s, 0.09, 0.11, 0.09, 0, k % 2 ? '#f08a2a' : '#e8402e'); solidBox(x - 0.25, z - 0.25, x + 0.25, z + 0.25); }
}
function addBamboo(x, z, far = false) {
  const n = 5 + ((rnd() * 4) | 0);
  for (let k = 0; k < n; k++) {
    const dx = (rnd() - 0.5) * 0.7, dz = (rnd() - 0.5) * 0.7, h = 3 + rnd() * 2, lx = (rnd() - 0.5) * 0.5, lz = (rnd() - 0.5) * 0.5;
    trunkB.putDir(x + dx, 0, z + dz, x + dx + lx, h, z + dz + lz, 0.045, k % 2 ? '#b9d05a' : '#9ec24a');
    for (let q = 0; q < 3; q++) frondB.put(x + dx + lx, h - 0.1, z + dz + lz, 0.55, 0.55, 0.55, rnd() * 6.283, '#7cc24a', -0.2 + rnd() * 0.3);
  }
  if (!far) solidBox(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
function addBush(x, z) {
  const g = ['#3da84a', '#4fb84f', '#2f9a44'][(rnd() * 3) | 0];
  leafB.put(x, 0.32, z, 0.46, 0.38, 0.46, rnd() * 6, g);
  leafB.put(x + 0.3, 0.25, z + 0.12, 0.3, 0.26, 0.3, rnd() * 6, g);
  const fl = ['#ff3b5c', '#ffcf3a', '#ff7ac8', '#ffffff'][(rnd() * 4) | 0];
  for (let k = 0; k < 5; k++) flowerB.put(x + (rnd() - 0.5) * 0.7, 0.42 + rnd() * 0.22, z + 0.15 + rnd() * 0.2, 0.08, 0.08, 0.08, 0, rnd() < 0.8 ? fl : '#ffffff');
  solidBox(x - 0.4, z - 0.3, x + 0.5, z + 0.35);
}
function freeTile(i, j, m = 1) {
  for (let dj = -m; dj <= m; dj++) for (let di = -m; di <= m; di++) { if (!inMap(i + di, j + dj)) continue; if (used[id(i + di, j + dj)]) return false; }
  return true;
}
function freeSand(i, j, m = 1) {
  for (let dj = -m; dj <= m; dj++) for (let di = -m; di <= m; di++) { if (!inMap(i + di, j + dj)) continue; if (occ[id(i + di, j + dj)]) return false; }
  return true;
}
function scatterNature() {
  const fm = swayMat('#ffffff', 'z', 0.08, { side: THREE.DoubleSide, flatShading: true });
  const bm = swayMat('#ffffff', 'z', 0.06, { side: THREE.DoubleSide });
  const tm = swayMat('#ffffff', 'y', 0.09);
  FOLIAGE.leaf = toon('#ffffff');
  trunkB = batch(G.cyl6, 4800); frondB = batch(makeFrondGeo(1, 12, 0.3, 0.55), 8200, { mat: fm }); bananaB = batch(makeFrondGeo(1, 8, 0.48, 1, 0.8, 0.9), 1800, { mat: bm });
  coconB = batch(G.ico0, 3000); leafB = batch(G.ico, 3200, { mat: FOLIAGE.leaf });
  tuftB = batch(G.cone4, 4800, { cast: false, mat: tm }); flowerB = batch(G.ico0, 3000, { cast: false });
  rockB = batch(G.rock, 300, { flat: true }); padB = batch(G.cyl, 200, { cast: false }); reedB = batch(G.cyl6, 700, { cast: false });
  shellB = batch(G.ico0, 80, { cast: false });
  // cocotiers de cueillette (à secouer) autour de la ferme et de la plage
  FORAGE_PALMS.forEach(([x, z], idx) => {
    const top = addPalm(x, z, 1.15);
    const g = new THREE.Group(); g.position.set(top[0], top[1] - 0.2, top[2]); scene.add(g);
    for (const [dx, dz] of [[0.14, 0.05], [-0.1, 0.12], [0.02, -0.14]]) part(g, G.sph, '#7a5a2a', [0.13, 0.15, 0.13], [dx, 0, dz]);
    forage.push({ x, z, idx, has: false, g });
  });
  // décor fixe de la ferme
  addBush(5.6, 11.2); addBush(32.6, 11); addBush(5.9, 40.6);
  addMango(15.8, 14.6, 1.1);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = id(i, j), t = tiles[k], x = i + 0.25 + rnd() * 0.5, z = j + 0.25 + rnd() * 0.5;
    if (t === GRASS) {
      const border = i < 3 || i >= W - 3 || j < 3;
      if (border) { if (!used[k] && rnd() < 0.75) { const r = rnd(); if (r < 0.55) addPalm(x, z, 0.85 + rnd() * 0.5); else if (r < 0.7) addBanana(x, z, 1 + rnd() * 0.3); else if (r < 0.85) addMango(x, z, 0.9 + rnd() * 0.4); else addBamboo(x, z); used[k] = 1; } continue; }
      if (inField(i, j) || i >= 16 && i <= 34 && j <= 12) continue;
      const nearRiver = tileAt(i + 1, j) === RIVER || tileAt(i - 1, j) === RIVER || tileAt(i + 2, j) === RIVER || tileAt(i - 2, j) === RIVER;
      const p = i >= 34 && i <= 37 ? 0.2 : nearRiver ? 0.12 : (i > 43 ? 0.045 : 0.02);
      if (rnd() < p && freeTile(i, j, 1)) {
        const r = rnd();
        if (r < 0.45) addPalm(x, z, 0.85 + rnd() * 0.5); else if (r < 0.6) addBanana(x, z, 1 + rnd() * 0.3); else if (r < 0.72) addMango(x, z, 0.9 + rnd() * 0.4);
        else if (r < 0.88) addBush(x, z); else addBamboo(x, z);
        used[k] = 1;
      }
    } else if (t === SAND && !isWater(tileAt(i, j + 1)) && freeSand(i, j, 1) && !(i >= 58 && i <= 68) && !(i >= 84 && i <= 88)) {
      if (rnd() < 0.085) { addPalm(x, z, 0.9 + rnd() * 0.4); occ[k] = 1; }
      else if (rnd() < 0.018 && shellSpots.length < 70) shellSpots.push([x, z]);
    }
  }
  // forêt hors carte : cocotiers, bananiers, bambous
  const forest = (x, z) => { const r = rnd(); if (r < 0.58) addPalm(x, z, 0.9 + rnd() * 0.6, { far: true }); else if (r < 0.74) addBanana(x, z, 1.1, true); else if (r < 0.9) addMango(x, z, 1.0, true); else addBamboo(x, z, true); };
  for (let z = -9; z < coastZ(0) - 4; z += 1.7) for (let x = -9; x < 0; x += 1.7) forest(x + rnd() * 0.9, z + rnd() * 0.9);
  for (let z = -9; z < coastZ(W - 1) - 4; z += 1.7) for (let x = W + 0.4; x < W + 9; x += 1.7) forest(x + rnd() * 0.9, z + rnd() * 0.9);
  for (let z = -9; z < 0; z += 1.7) for (let x = 0; x < W; x += 1.7) forest(x + rnd() * 0.9, z + rnd() * 0.9);
  // herbes, fougères, fleurs
  const FL = ['#ffffff', '#ffd84a', '#ff7ac8', '#ff3b5c', '#9fbfff', '#ffffff'];
  for (let j = 3; j < H; j++) for (let i = 3; i < W - 3; i++) {
    const k = id(i, j), t = tiles[k];
    if (t !== GRASS || used[k] && !inField(i, j)) continue;
    const field = inField(i, j);
    if (rnd() < (field ? 0.3 : 0.24)) {
      const list = [];
      const cx = i + 0.2 + rnd() * 0.6, cz = j + 0.2 + rnd() * 0.6, col = rnd() < 0.5 ? '#74c85a' : '#58b448';
      for (let s = 0; s < 3; s++) list.push([tuftB, tuftB.put(cx + (rnd() - 0.5) * 0.18, 0.13, cz + (rnd() - 0.5) * 0.18, 0.05, 0.28 + rnd() * 0.12, 0.05, rnd() * 6, col, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5)]);
      if (field) tileDecor.set(k, list);
    }
    if (!field && rnd() < 0.045) { const L = 0.35 + rnd() * 0.3; for (let q = 0; q < 5; q++) bananaB.put(i + 0.5, 0.05, j + 0.5, L, L, L, q * 1.26 + rnd() * 0.4, ['#4fb84f', '#5fc24a'][q & 1], -0.5 + rnd() * 0.3); }
    if (!field && rnd() < 0.09) flowerB.put(i + rnd(), 0.11, j + rnd(), 0.075, 0.075, 0.075, 0, FL[rnd() * FL.length | 0]);
  }
  // rochers, roseaux, nénuphars
  for (let j = 3; j < H; j++) for (let i = 1; i < W - 1; i++) {
    const k = id(i, j), t = tiles[k];
    if (t === RIVER && !wood[k] && rnd() < 0.08) { padB.put(i + rnd(), -0.25, j + rnd(), 0.26, 0.025, 0.26, rnd() * 6, '#3fb84f'); if (rnd() < 0.3) flowerB.put(i + 0.5, -0.18, j + 0.5, 0.08, 0.06, 0.08, 0, '#ff7ac8'); }
    if ((t === GRASS || t === SAND) && (tiles[id(i + 1, j)] === RIVER || tiles[id(i - 1, j)] === RIVER) && rnd() < 0.35 && !wood[id(i + 1, j)] && !wood[id(i - 1, j)] && j !== 24 && j !== 25) {
      const side = tiles[id(i + 1, j)] === RIVER ? 0.85 : 0.15;
      for (let s = 0; s < 3; s++) { const x = i + side + (rnd() - 0.5) * 0.2, z = j + rnd(), h = 0.5 + rnd() * 0.4; reedB.put(x, h / 2, z, 0.025, h, 0.025, 0, '#7aa04e'); if (s === 0) reedB.put(x, h, z, 0.045, 0.16, 0.045, 0, '#7a4b2e'); }
    }
    if (t === SAND && tiles[id(i, j + 1)] === SEA && !occ[k] && rnd() < 0.07 && Math.abs(i - 63) > 3) { const s = 0.2 + rnd() * 0.25; rockB.put(i + rnd(), s * 0.4, j + 0.6 + rnd() * 0.4, s, s * 0.8, s * 1.1, rnd() * 6, rnd() < 0.5 ? '#b3a99c' : '#9a9088'); }
    if (t === GRASS && !used[k] && !inField(i, j) && rnd() < 0.008) { const s = 0.18 + rnd() * 0.15; rockB.put(i + rnd(), s * 0.4, j + rnd(), s, s * 0.75, s, rnd() * 6, '#b3a99c'); }
  }
  // coquillages candidats (pool fixe, certains actifs chaque jour)
  shellSpots.forEach(([x, z], k) => shellB.put(x, 0.07, z, 0.1, 0.07, 0.1, rnd() * 6, ['#ffb7c9', '#fff4e2', '#ffd9a0'][k % 3]));
  for (const b of [trunkB, frondB, bananaB, coconB, leafB, tuftB, flowerB, rockB, padB, reedB, shellB]) b.flush();
}
const tileDecor = new Map(); // tuile du champ → [[batch, index]…] pour l'herbe fauchée au labour

// Cueillette quotidienne : noix de coco et coquillages
function refreshForage() {
  for (const f of forage) { f.has = dayRand(S.day, f.idx * 5.3 + 1.1) < 0.78 && !S.picked.coco.includes(f.idx); f.g.visible = f.has; }
  shellSpots.forEach((sp, k) => {
    const on = dayRand(S.day, k * 3.7 + 9.1) < 0.2 && !S.picked.shells.includes(k);
    sp.on = on;
    if (on) shellB.set(k, sp[0], 0.07, sp[1], 0.1, 0.07, 0.1, hash2(k, 3) * 6); else shellB.hide(k);
  });
  shellB.instanceMatrix.needsUpdate = true;
}

// ---------------------------------------------------------------------
// Faune et effets : papillons, lucioles, nuages, pluie, arc-en-ciel, crabes
// ---------------------------------------------------------------------
let butterflies = [], fireflies = [], clouds = [], rainB, rainDrops = [], rainbowG, crabs = [], butB, fireB, cloudG;
function initNature() {
  const wing = new THREE.BufferGeometry().setFromPoints([[0, 0, 0], [-0.16, 0, 0.1], [-0.13, 0, -0.1], [0, 0, 0], [0.13, 0, -0.1], [0.16, 0, 0.1]].map(p => new THREE.Vector3(...p)));
  butB = batch(wing, 40, { cast: false, mat: new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide }) });
  for (let k = 0; k < 40; k++) { butB.put(0, -50, 0, 1, 1, 1, 0, ['#ff7a3b', '#ffd84a', '#ff7ac8', '#5ac8f0', '#ffffff'][k % 5]); butterflies.push({ x: 20 + rnd() * 70, z: 5 + rnd() * 40, y: 0.8 + rnd(), a: rnd() * 6, s: 0.8 + rnd() * 0.8, ph: rnd() * 9 }); }
  fireB = batch(G.ico0, 110, { cast: false, mat: new THREE.MeshBasicMaterial({ color: '#d9ff7a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }) });
  fireB.layers.set(1);
  for (let k = 0; k < 110; k++) { fireB.put(0, -50, 0, 1, 1, 1, 0, k % 3 ? '#d9ff7a' : '#ffe27a'); fireflies.push({ x: 0, z: 0, y: 0.4 + rnd() * 1.6, a: rnd() * 6, ph: rnd() * 9, on: false }); }
  // nuages : leur ombre balaie le sol, eux-mêmes restent hors champ
  cloudG = new THREE.Group(); scene.add(cloudG);
  for (let k = 0; k < 16; k++) {
    const c = new THREE.Group(); const n = 3 + ((rnd() * 3) | 0);
    for (let q = 0; q < n; q++) { const m = part(c, G.ico, '#ffffff', [2.2 + rnd() * 1.6, 1.0 + rnd() * 0.4, 2 + rnd() * 1.2], [(q - n / 2) * 2.4, rnd() * 0.5, (rnd() - 0.5) * 1.5]); m.receiveShadow = false; }
    cloudG.add(c); clouds.push({ g: c, x: rnd() * 100 - 4, z: rnd() * 70 - 4, sp: 0.5 + rnd() * 0.6 });
  }
  rainB = batch(G.box, 1000, { cast: false, mat: new THREE.MeshBasicMaterial({ color: '#cfe8f4', transparent: true, opacity: 0.55, depthWrite: false }) });
  rainB.layers.set(1);
  for (let k = 0; k < 1000; k++) { rainB.put(0, -50, 0, 0.018, 0.5, 0.018, 0, '#ffffff'); rainDrops.push({ x: (rnd() - 0.5) * 38, z: (rnd() - 0.5) * 34, y: rnd() * 14 }); }
  rainbowG = new THREE.Group(); rainbowG.position.set(40, 0, 17); scene.add(rainbowG);
  [['#e2362f', 11.0], ['#f6c026', 10.55], ['#2fa84f', 10.1], ['#17a9c7', 9.65]].forEach(([c, r]) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.24, 6, 60, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false }));
    m.layers.set(1); rainbowG.add(m);
  });
  // crabes sur le sable
  for (let k = 0; k < 9; k++) {
    const i = 30 + ((rnd() * 56) | 0), j = coastZ(i) - 2;
    const g = new THREE.Group(); scene.add(g);
    part(g, G.ico, '#e8503a', [0.14, 0.08, 0.1], [0, 0.1, 0]);
    for (const s of [-1, 1]) { part(g, G.ico0, '#e8503a', [0.06, 0.05, 0.06], [s * 0.2, 0.14, 0.08]); part(g, G.ico0, '#fff', [0.025, 0.04, 0.025], [s * 0.05, 0.2, 0.06]); part(g, G.cyl6, '#c8402e', [0.01, 0.12, 0.01], [s * 0.13, 0.05, -0.04], [0, 0, s * 0.8]); }
    crabs.push({ g, x: i + 0.5, z: j + 0.5, vx: 0, t: rnd() * 3, face: 0 });
  }
}
const rainTmp = new THREE.Vector3();
function updateNature(dt, tsec, focus, sdir) {
  // papillons : seulement par beau temps et en journée
  const bf = (1 - ENV.night) * (1 - ENV.rain) > 0.5 ? 1 : 0, season = seasonOf(S.day);
  const nBut = Math.round(bf * (season === 0 ? 40 : season === 1 ? 28 : season === 3 ? 12 : 8));
  butterflies.forEach((b, k) => {
    if (k >= nBut) { butB.hide(k); return; }
    b.a += (Math.sin(tsec * 0.7 + b.ph) * 1.8) * dt; b.x += Math.cos(b.a) * b.s * dt; b.z += Math.sin(b.a) * b.s * dt;
    if (Math.hypot(b.x - focus.x, b.z - focus.z) > 22) { b.x = focus.x + (rnd() - 0.5) * 30; b.z = focus.z + (rnd() - 0.5) * 24; }
    const flap = 0.25 + Math.abs(Math.cos(tsec * 16 + b.ph)) * 0.75;
    butB.set(k, b.x, b.y + Math.sin(tsec * 2 + b.ph) * 0.2, b.z, flap, 1, 1, -b.a + Math.PI / 2, 0.15);
  });
  butB.instanceMatrix.needsUpdate = true;
  // lucioles : la nuit, loin de la pluie
  const nf = clamp((ENV.night - 0.35) * 2.2, 0, 1) * (1 - ENV.rain);
  fireB.material.opacity = nf;
  fireflies.forEach((f, k) => {
    if (nf <= 0.01) { if (f.on) { fireB.hide(k); f.on = false; } return; }
    f.on = true; f.a += Math.sin(tsec * 0.9 + f.ph) * 1.4 * dt; f.x += Math.cos(f.a) * 0.5 * dt; f.z += Math.sin(f.a) * 0.5 * dt;
    if (Math.hypot(f.x - focus.x, f.z - focus.z) > 18 || (f.x === 0 && f.z === 0)) { f.x = focus.x + (rnd() - 0.5) * 32; f.z = focus.z + (rnd() - 0.5) * 26; }
    const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(tsec * 2.4 + f.ph * 3));
    const s = 0.045 + pulse * 0.05;
    fireB.set(k, f.x, f.y + Math.sin(tsec * 1.3 + f.ph) * 0.25, f.z, s, s, s);
  });
  fireB.instanceMatrix.needsUpdate = true;
  // nuages
  const cover = 0.35 + ENV.cloud * 0.65;
  clouds.forEach((c, k) => {
    c.x += c.sp * WIND.uWind.value * dt * 1.4; if (c.x > W + 14) c.x = -14;
    const h = 24 + (k % 4);
    c.g.visible = k / clouds.length < cover;
    c.g.position.set(c.x + sdir.x / sdir.y * h, h, c.z + sdir.z / sdir.y * h);
  });
  // pluie
  const rn = ENV.rain;
  const cnt = Math.round(1000 * Math.min(1, rn * (ENV.storm > 0.5 ? 1 : 0.7)));
  rainB.count = cnt;
  const sp = 24 + ENV.storm * 10;
  for (let k = 0; k < cnt; k++) {
    const d = rainDrops[k]; d.y -= sp * dt; if (d.y < 0) { d.y += 14; d.x = (rnd() - 0.5) * 38; d.z = (rnd() - 0.5) * 34; }
    rainB.set(k, focus.x + d.x, d.y, focus.z + d.z + 3, 0.018, 0.55, 0.018, 0, 0.12);
  }
  rainB.instanceMatrix.needsUpdate = true;
  // arc-en-ciel
  rainbowG.children.forEach(m => m.material.opacity = ENV.rainbow * 0.7);
  rainbowG.visible = ENV.rainbow > 0.01;
  // crabes
  for (const c of crabs) {
    const d = Math.hypot(P.x - c.x, P.z - c.z); c.t -= dt;
    if (d < 2.5) { c.vx = Math.sign(c.x - P.x || 1) * 2.2; c.t = 0.6; }
    else if (c.t <= 0) { c.vx = rnd() < 0.5 ? 0 : (rnd() < 0.5 ? -0.6 : 0.6); c.t = 0.6 + rnd() * 2; }
    const nx = c.x + c.vx * dt; if (!blocked(nx, c.z, 0.1) && tileAt(Math.floor(nx), Math.floor(c.z)) === SAND) c.x = nx; else c.vx = -c.vx;
    c.g.position.set(c.x, 0, c.z); c.g.rotation.y = 0; c.g.children[0].position.y = 0.1 + Math.abs(Math.sin(tsec * 14 + c.t)) * (c.vx ? 0.02 : 0);
    c.g.visible = !wet(S.weather) && ENV.night < 0.6;
  }
}
