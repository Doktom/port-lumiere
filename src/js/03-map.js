// =====================================================================
// Carte (tuiles de 1 unité). x = est, z = sud. La mer est au sud.
// =====================================================================
const W = 96, H = 64;
const GRASS = 0, PATH = 1, SAND = 2, RIVER = 3, SEA = 4, PLAZA = 5;
const tiles = new Uint8Array(W * H), wood = new Uint8Array(W * H), used = new Uint8Array(W * H), occ = new Uint8Array(W * H);
const id = (i, j) => j * W + i;
const inMap = (i, j) => i >= 0 && j >= 0 && i < W && j < H;
const isWater = t => t === RIVER || t === SEA;
const coastZ = i => 50 + Math.round(Math.sin(i * 0.23) * 0.9 + Math.sin(i * 0.07 + 1) * 1.1);
const riverX = j => 39.5 + Math.sin(j * 0.13) * 2.0 + Math.sin(j * 0.05 + 2) * 1.2;
const tileAt = (i, j) => inMap(i, j) ? tiles[id(i, j)] : (j >= coastZ(clamp(i, 0, W - 1)) ? SEA : GRASS);
const waterAt = (i, j) => { if (!inMap(i, j)) return j >= 46; const k = id(i, j); return isWater(tiles[k]) && !wood[k]; };
function setRect(i0, j0, i1, j1, t) { for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (inMap(i, j) && !isWater(tiles[id(i, j)])) tiles[id(i, j)] = t; }
// Champ cultivable (sous la maison) et enclos des animaux (à l'est de la maison)
const inField = (i, j) => i >= 5 && i <= 32 && j >= 13 && j <= 42;
const PLAZA_C = [63.5, 24.5];

function genMap() {
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const c = coastZ(i); let t = GRASS;
    if (j >= c) t = SEA; else if (j >= c - 4) t = SAND;
    if (t !== SEA && Math.abs(i + 0.5 - riverX(j)) < 1.6) t = RIVER;
    tiles[id(i, j)] = t;
  }
  setRect(10, 12, 11, 23, PATH);       // allée de la maison
  setRect(10, 24, 88, 25, PATH);       // grand-rue jusqu'au phare
  setRect(55, 17, 71, 31, PLAZA);      // place du village
  setRect(57, 15, 62, 16, PATH);       // devant Graines Irie
  setRect(62, 32, 64, 45, PATH);       // descente vers le port
  setRect(48, 17, 49, 23, PATH); setRect(78, 18, 79, 23, PATH);
  setRect(74, 26, 75, 37, PATH); setRect(74, 36, 80, 37, PATH);
  setRect(52, 26, 53, 37, PATH); setRect(46, 36, 53, 37, PATH);
  setRect(85, 26, 86, 45, PATH);
  for (let i = 0; i < W; i++) for (const j of [24, 25]) if (tiles[id(i, j)] === RIVER) wood[id(i, j)] = 1;
  for (let j = 44; j <= 59; j++) for (let i = 62; i <= 64; i++) if (tiles[id(i, j)] === SEA) wood[id(i, j)] = 1;
  for (let j = 58; j <= 59; j++) for (let i = 58; i <= 68; i++) if (tiles[id(i, j)] === SEA) wood[id(i, j)] = 1;
  for (let k = 0; k < W * H; k++) if (tiles[k] !== GRASS) used[k] = 1;
}
genMap();

// Collisions : tuiles d'eau + boîtes (murs, arbres, clôtures…)
const boxes = [];
function reserve(x0, z0, x1, z1, m = 0) {
  for (let j = Math.floor(z0 - m); j < Math.ceil(z1 + m); j++) for (let i = Math.floor(x0 - m); i < Math.ceil(x1 + m); i++) if (inMap(i, j)) { used[id(i, j)] = 1; occ[id(i, j)] = 1; }
}
function solidBox(x0, z0, x1, z1) { boxes.push([x0, z0, x1, z1]); reserve(x0, z0, x1, z1); }
function circleBox(x, z, r, x0, z0, x1, z1) { const cx = clamp(x, x0, x1), cz = clamp(z, z0, z1), dx = x - cx, dz = z - cz; return dx * dx + dz * dz < r * r; }
function blocked(x, z, r) {
  if (x < r || z < r || x > W - r || z > H - r) return true;
  for (let j = Math.floor(z - r); j <= Math.floor(z + r); j++) for (let i = Math.floor(x - r); i <= Math.floor(x + r); i++) {
    if (waterAt(i, j) && circleBox(x, z, r, i, j, i + 1, j + 1)) return true;
  }
  for (const b of boxes) if (circleBox(x, z, r, b[0], b[1], b[2], b[3])) return true;
  return false;
}

// Lieux où les villageois passent leur journée (x, z)
const SPOTS = {
  pearl_counter: [60, 14.6], pearl_home: [62.4, 14.5],
  winston_counter: [71, 43.6], winston_home: [73.4, 43.5],
  zion_counter: [80, 35.5], zion_home: [83.4, 35.4],
  desta_counter: [79, 18.6], desta_home: [81.4, 18.5],
  ivy_home: [48.6, 17.7],
  plaza_a: [59.6, 22.2], plaza_b: [67.4, 22.2], plaza_c: [60, 27.8], market: [66.2, 20.4],
  cafe_a: [78.4, 38.9], cafe_b: [82.2, 39.1],
  beach_a: [57, 48.4], beach_b: [73.5, 48.6], pier_a: [63.5, 51], pier_end: [63.5, 57.6], river_a: [37.4, 28],
};
let walk = null;
function buildWalk() {
  walk = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) walk[id(i, j)] = blocked(i + 0.5, j + 0.5, 0.3) ? 0 : 1;
}
function nearestWalk(x, z) {
  const ci = clamp(Math.floor(x), 0, W - 1), cj = clamp(Math.floor(z), 0, H - 1);
  if (walk[id(ci, cj)]) return [ci + 0.5, cj + 0.5];
  let best = null, bd = 1e9;
  for (let r = 1; r <= 10 && !best; r++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
    if (!inMap(i, j) || !walk[id(i, j)]) continue;
    const d = Math.hypot(i + 0.5 - x, j + 0.5 - z); if (d < bd) { bd = d; best = [i + 0.5, j + 0.5]; }
  }
  return best || [ci + 0.5, cj + 0.5];
}
function astar(sx, sz, tx, tz) {
  const si = Math.floor(sx), sj = Math.floor(sz), ti = Math.floor(tx), tj = Math.floor(tz);
  const N = W * H, g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const hf = [], hi = [];
  const push = (f, k) => { let n = hf.length; hf.push(f); hi.push(k); while (n > 0) { const p = (n - 1) >> 1; if (hf[p] <= hf[n]) break; [hf[p], hf[n]] = [hf[n], hf[p]]; [hi[p], hi[n]] = [hi[n], hi[p]]; n = p; } };
  const pop = () => {
    const k = hi[0], lf = hf.pop(), li = hi.pop();
    if (hf.length) { hf[0] = lf; hi[0] = li; let n = 0; for (;;) { const a = n * 2 + 1, b = a + 1; let m = n; if (a < hf.length && hf[a] < hf[m]) m = a; if (b < hf.length && hf[b] < hf[m]) m = b; if (m === n) break; [hf[m], hf[n]] = [hf[n], hf[m]]; [hi[m], hi[n]] = [hi[n], hi[m]]; n = m; } }
    return k;
  };
  const h = (i, j) => { const dx = Math.abs(i - ti), dj = Math.abs(j - tj); return dx + dj + (1.414 - 2) * Math.min(dx, dj); };
  const s = id(si, sj); g[s] = 0; push(h(si, sj), s);
  while (hf.length) {
    const k = pop(); if (closed[k]) continue; closed[k] = 1;
    const i = k % W, j = (k / W) | 0;
    if (i === ti && j === tj) break;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj; if (!inMap(ni, nj) || !walk[id(ni, nj)]) continue;
      if (di && dj && (!walk[id(i + di, j)] || !walk[id(i, j + dj)])) continue;
      const nk = id(ni, nj), ng = g[k] + (di && dj ? 1.414 : 1);
      if (ng < g[nk]) { g[nk] = ng; came[nk] = k; push(ng + h(ni, nj), nk); }
    }
  }
  const t = id(ti, tj); if (came[t] < 0 && t !== s) return null;
  const out = []; for (let k = t; k !== -1; k = came[k]) out.push([k % W + 0.5, ((k / W) | 0) + 0.5]);
  return out.reverse();
}
// Chemin complet : segment direct hors grille, A* sur la grille, segment direct d'arrivée
function findPath(sx, sz, tx, tz) {
  const [ax, az] = nearestWalk(sx, sz), [bx, bz] = nearestWalk(tx, tz);
  const mid = astar(ax, az, bx, bz) || [[bx, bz]];
  const out = [];
  if (Math.hypot(sx - ax, sz - az) > 0.25) out.push([ax, az]);
  for (const p of mid) out.push(p);
  if (Math.hypot(tx - bx, tz - bz) > 0.25) out.push([tx, tz]);
  return out;
}
