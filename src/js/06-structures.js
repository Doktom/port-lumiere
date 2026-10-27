// =====================================================================
// Constructions : cases colorées, boutiques, café de plage, sound system…
// =====================================================================
const RASTA = ['#e2362f', '#f6c026', '#2fa84f'];
function prismGeo(w, h, d) {
  const A = [-w / 2, 0, d / 2], B = [w / 2, 0, d / 2], C = [-w / 2, 0, -d / 2], D = [w / 2, 0, -d / 2], E = [-w / 2, h, 0], F = [w / 2, h, 0];
  const tris = [A, B, F, A, F, E, D, C, E, D, E, F, C, A, E, B, D, F, A, C, D, A, D, B];
  const ns = Math.max(3, Math.round(w * 2.6)), uv = [];
  for (const p of tris) uv.push((p[0] / w + 0.5) * ns, p[1] / h);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals(); return geo;
}
const fades = [];
function fadeable(g, x0, z0, x1, z1) {
  const mats = new Map();
  g.traverse(o => {
    if (!o.isMesh || o.material === winMat || o.material === lampMat || o.material === fireMat) return;
    let m = mats.get(o.material);
    if (!m) { m = o.material.clone(); m.transparent = true; mats.set(o.material, m); }
    o.material = m;
  });
  fades.push({ x0, z0, x1, z1, mats: [...mats.values()], a: 1 });
}
const smokes = [], flags = [], speakers = [], torches = [], stageObjs = {};
function smoke(x, y, z) {
  for (let k = 0; k < 4; k++) {
    const m = part(scene, G.ico, '#f4efe8', [0.2, 0.2, 0.2], [x, y, z]); m.castShadow = false;
    smokes.push({ m, x, y, z, t: k / 4 });
  }
}
function windowAt(g, x, y, z, shutter, rotY = 0) {
  const w = new THREE.Group(); w.position.set(x, y, z); w.rotation.y = rotY; g.add(w);
  part(w, G.box, '#5b3a2a', [0.82, 0.72, 0.06], [0, 0, 0]);
  const glass = new THREE.Mesh(G.box, winMat); glass.scale.set(0.62, 0.52, 0.08); w.add(glass);
  part(w, G.box, '#5b3a2a', [0.06, 0.52, 0.1], [0, 0, 0]); part(w, G.box, '#5b3a2a', [0.62, 0.06, 0.1], [0, 0, 0]);
  if (shutter) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) part(w, G.box, shutter, [0.2, 0.1, 0.05], [s * 0.52, -0.27 + k * 0.18, 0.03], [0.35, 0, 0]);
  part(w, G.box, '#8a5a3a', [0.86, 0.14, 0.2], [0, -0.43, 0.09]);
  for (let k = 0; k < 4; k++) part(w, G.ico0, ['#ff3b5c', '#ffd84a', '#ffffff', '#ff7ac8'][k], [0.07, 0.07, 0.07], [-0.3 + k * 0.2, -0.32, 0.12]);
}
function signTex(text, w = 512, h = 128, bg = '#fff3cf', fg = '#241a2e', size = 62) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.strokeStyle = fg; x.lineWidth = 10; x.beginPath(); x.roundRect(6, 6, w - 12, h - 12, 22); x.fill(); x.stroke();
  x.save(); x.beginPath(); x.roundRect(11, 11, w - 22, h - 22, 18); x.clip();
  RASTA.forEach((c2, k) => { x.fillStyle = c2; x.fillRect(11 + k * (w - 22) / 3, 11, (w - 22) / 3 + 1, 16); }); x.restore();
  x.fillStyle = fg; x.font = `${size}px "Lilita One", "Trebuchet MS", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 10);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function signBoard(parent, text, x, y, z, w = 2.6, h = 0.65, rotY = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: signTex(text, 512, Math.round(512 * h / w) + 20, '#fff3cf', '#241a2e', 62), gradientMap: gradTex }));
  m.position.set(x, y, z); m.rotation.y = rotY; m.castShadow = true; parent.add(m);
  const b = part(parent, G.box, '#5b3a2a', [w + 0.08, h + 0.08, 0.06], [x, y, z - 0.04]); b.rotation.y = rotY;
  return m;
}
const roofMesh = (parent, cx, y, cz, w, h, d, color, mapName = 'zinc') => {
  const r = new THREE.Mesh(prismGeo(w, h, d), toon(color, { mapName, flatShading: true }));
  r.position.set(cx, y, cz); r.castShadow = r.receiveShadow = true; parent.add(r); return r;
};
const wallMat = c => toon(c, { mapName: 'plank' });

function makeSpeaker(parent, x, z, hgt, rotY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; parent.add(g);
  part(g, G.box, '#1d1a24', [0.9, hgt, 0.78], [0, hgt / 2, 0]);
  for (const [yy, r, ring] of [[hgt * 0.3, 0.3, '#e2362f'], [hgt * 0.72, 0.22, '#f6c026']]) {
    part(g, G.cyl, ring, [r + 0.05, 0.04, r + 0.05], [0, yy, 0.4], [Math.PI / 2, 0, 0]);
    const cone = part(g, G.sph, '#3a3446', [r, r, r * 0.45], [0, yy, 0.42]);
    speakers.push({ m: cone, sx: r, sz: r * 0.45 });
  }
  part(g, G.ico0, '#2fa84f', [0.07, 0.07, 0.07], [0.32, hgt - 0.12, 0.4]);
  return g;
}
function makeHammock(parent, ax, ay, az, bx, by, bz, wid = 0.9, sag = 0.5) {
  const n = 9, dirV = new THREE.Vector3();
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n, f = t => 4 * t * (1 - t) * sag;
    const p0 = [lerp(ax, bx, t0), lerp(ay, by, t0) - f(t0), lerp(az, bz, t0)], p1 = [lerp(ax, bx, t1), lerp(ay, by, t1) - f(t1), lerp(az, bz, t1)];
    dirV.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); const len = dirV.length();
    const m = part(parent, G.box, RASTA[k % 3], [wid, 0.07, len + 0.02], [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2]);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirV.normalize());
  }
}
function tikiTorch(x, z, hgt = 2.6) {
  part(scene, G.cyl6, '#c9a45a', [0.06, hgt, 0.06], [x, hgt / 2, z]);
  for (const yy of [0.5, 1.1, 1.7, 2.3]) if (yy < hgt) part(scene, G.cyl6, '#8a6a30', [0.075, 0.04, 0.075], [x, yy, z]);
  part(scene, G.cone4, '#6b4a2a', [0.2, 0.2, 0.2], [x, hgt + 0.02, z], [Math.PI, Math.PI / 4, 0]);
  const flame = new THREE.Mesh(G.cone, fireMat); flame.scale.set(0.1, 0.3, 0.1); flame.position.set(x, hgt + 0.25, z); scene.add(flame);
  const glow = new THREE.Sprite(glowMat.clone()); glow.scale.set(2.4, 2.4, 1); glow.position.set(x, hgt + 0.2, z); glow.layers.set(1); scene.add(glow);
  torches.push({ x, z, y: hgt + 0.2, flame, glow });
  solidBox(x - 0.12, z - 0.12, x + 0.12, z + 0.12);
}
const glowMat = new THREE.SpriteMaterial({
  map: canvasTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,214,130,1)'); g.addColorStop(0.35, 'rgba(255,170,70,.45)'); g.addColorStop(1, 'rgba(255,140,40,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, false),
  transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
});
let buntB, bulbB, ropeMat;
function bunting(ax, ay, az, bx, by, bz, sag = 0.5, bulbs = false) {
  const len = Math.hypot(bx - ax, bz - az), n = Math.max(4, Math.round(len / 0.55)), pts = [];
  for (let k = 0; k <= n; k++) { const t = k / n; pts.push([lerp(ax, bx, t), lerp(ay, by, t) - 4 * t * (1 - t) * sag, lerp(az, bz, t)]); }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), ropeMat); line.layers.set(1); scene.add(line);
  const ang = Math.atan2(bx - ax, bz - az) + Math.PI / 2;
  for (let k = 1; k < n; k++) {
    const p = pts[k];
    if (bulbs) bulbB.put(p[0], p[1] - 0.06, p[2], 0.07, 0.07, 0.07, 0, ['#ffd84a', '#ff5a5a', '#5ee07a', '#ffb347'][k % 4]);
    else buntB.put(p[0], p[1], p[2], 1, 1, 1, ang, k % 7 === 6 ? '#241a2e' : RASTA[k % 3]);
  }
}
function flagPole(x, z, hgt = 3.6, s = 1) {
  part(scene, G.cyl6, '#8a6a30', [0.05, hgt, 0.05], [x, hgt / 2, z]);
  part(scene, G.ico0, '#f6c026', [0.09, 0.09, 0.09], [x, hgt + 0.05, z]);
  const f = new THREE.Group(); f.position.set(x, hgt - 0.4 * s, z); scene.add(f);
  RASTA.forEach((c, k) => part(f, G.box, c, [0.9 * s, 0.26 * s, 0.025], [0.45 * s, (1 - k) * 0.26 * s, 0]));
  flags.push({ g: f, ph: x + z }); solidBox(x - 0.1, z - 0.1, x + 0.1, z + 0.1);
}

function makeHouse(x0, z0, w, d, o) {
  const g = new THREE.Group(); scene.add(g);
  const cx = x0 + w / 2, cz = z0 + d / 2, wh = o.h || 2.2, base = 0.3, fz = z0 + d;
  part(g, G.box, '#b3a79a', [w + 0.24, base, d + 0.24], [cx, base / 2, cz]);
  part(g, G.box, wallMat(o.wall), [w, wh, d], [cx, base + wh / 2, cz]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(g, G.box, o.trim, [0.2, wh, 0.2], [cx + sx * w / 2, base + wh / 2, cz + sz * d / 2]);
  part(g, G.box, o.trim, [w + 0.1, 0.16, 0.16], [cx, base + wh - 0.05, fz + 0.02]);
  roofMesh(g, cx, base + wh, cz, w + 0.8, o.rh || 1.5, d + 0.8, o.roof);
  part(g, G.box, '#8f8378', [0.5, 1.4, 0.5], [cx + w * 0.28, base + wh + 0.9, cz - 0.5]);
  smoke(cx + w * 0.28, base + wh + 1.7, cz - 0.5);
  const dx = cx + (o.doorX || 0);
  part(g, G.box, o.door || '#2fa84f', [0.9, 1.5, 0.08], [dx, base + 0.75, fz + 0.04]);
  part(g, G.box, o.trim, [1.1, 0.12, 0.1], [dx, base + 1.55, fz + 0.05]);
  part(g, G.sph, '#f6c026', [0.05, 0.05, 0.05], [dx + 0.3, base + 0.75, fz + 0.1]);
  for (const wx of o.win) windowAt(g, cx + wx, base + 1.25, fz + 0.03, o.shutter);
  // véranda
  part(g, G.box, '#c9a46a', [w - 0.2, 0.1, 1.4], [cx, 0.05, fz + 0.7]);
  for (const sx of [-1, 1]) part(g, G.cyl6, o.trim, [0.07, 1.95, 0.07], [cx + sx * (w / 2 - 0.3), 1.05, fz + 1.3]);
  part(g, G.box, o.roof, [w + 0.2, 0.07, 1.7], [cx, 2.2, fz + 0.9], [0.22, 0, 0]);
  if (o.deco === 'chair') { part(g, G.box, '#c28a4f', [0.5, 0.06, 0.5], [cx + w / 2 - 1, 0.45, fz + 0.9]); part(g, G.box, '#c28a4f', [0.5, 0.5, 0.06], [cx + w / 2 - 1, 0.72, fz + 1.15], [-0.25, 0, 0]); }
  if (o.deco === 'plants') for (const sx of [-1, 1]) { part(g, G.cyl, '#c2553d', [0.2, 0.3, 0.2], [cx + sx * (w / 2 - 0.9), 0.25, fz + 1.2]); part(g, G.ico, '#2fa84f', [0.3, 0.3, 0.3], [cx + sx * (w / 2 - 0.9), 0.65, fz + 1.2]); }
  solidBox(x0 - 0.12, z0 - 0.12, x0 + w + 0.12, fz + 0.12); reserve(x0, z0, x0 + w, fz + 1.8, 0.5);
  fadeable(g, x0 - 0.4, z0 - 3.4, x0 + w + 0.4, z0 + 0.8);
  return g;
}

// La case du joueur : murs séparés, toit et façade masqués quand on entre
let farmUpper, fireLight;
function makeFarmhouse() {
  const x0 = 7, z0 = 5, w = 8, d = 7, t = 0.25, wh = 2.2, cx = 11, cz = 8.5, y0 = 0.12;
  const wall = wallMat('#ffd24d'), trim = '#2fa84f';
  const g = new THREE.Group(); scene.add(g);
  const up = new THREE.Group(); g.add(up); farmUpper = up;
  part(g, G.box, '#b3a79a', [w + 0.3, 0.12, d + 0.3], [cx, 0.06, cz]);
  part(g, G.box, '#c99a66', [w - 0.1, 0.05, d - 0.1], [cx, 0.14, cz]);
  for (let k = 1; k < 16; k++) part(g, G.box, '#a97c52', [0.035, 0.052, d - 0.3], [x0 + k * 0.5, 0.145, cz]);
  const wallBox = (par, sx, sz, x, z, h = wh, y = y0) => part(par, G.box, wall, [sx, h, sz], [x, y + h / 2, z]);
  wallBox(g, w, t, cx, z0 + t / 2); wallBox(g, t, d, x0 + t / 2, cz); wallBox(g, t, d, x0 + w - t / 2, cz);
  solidBox(x0, z0, x0 + w, z0 + t); solidBox(x0, z0, x0 + t, z0 + d); solidBox(x0 + w - t, z0, x0 + w, z0 + d);
  wallBox(up, 3.4, t, 8.7, z0 + d - t / 2); wallBox(up, 3.4, t, 13.3, z0 + d - t / 2); wallBox(up, 1.2, t, 11, z0 + d - t / 2, 0.6, y0 + 1.6);
  part(g, G.box, wall, [3.4, 0.3, t], [8.7, y0 + 0.15, z0 + d - t / 2]); part(g, G.box, wall, [3.4, 0.3, t], [13.3, y0 + 0.15, z0 + d - t / 2]);
  solidBox(x0, z0 + d - t, 10.4, z0 + d); solidBox(11.6, z0 + d - t, x0 + w, z0 + d);
  for (const sx of [-1, 1]) { part(g, G.box, trim, [0.24, wh, 0.24], [cx + sx * w / 2, y0 + wh / 2, z0]); part(up, G.box, trim, [0.24, wh, 0.24], [cx + sx * w / 2, y0 + wh / 2, z0 + d]); }
  part(up, G.box, trim, [w + 0.1, 0.16, 0.16], [cx, y0 + wh - 0.06, z0 + d + 0.02]);
  for (const sx of [10.25, 11.75]) part(up, G.box, trim, [0.14, 1.65, 0.3], [sx, y0 + 0.82, z0 + d - t / 2]);
  part(up, G.box, trim, [1.6, 0.14, 0.3], [11, y0 + 1.66, z0 + d - t / 2]);
  part(up, G.box, '#e2362f', [0.04, 1.5, 0.05], [11, y0 + 0.9, z0 + d + 0.02]);   // porte rouge entrouverte
  windowAt(up, 8.6, y0 + 1.25, z0 + d + 0.03, '#e2362f'); windowAt(up, 13.4, y0 + 1.25, z0 + d + 0.03, '#e2362f');
  roofMesh(up, cx, y0 + wh, cz, w + 0.8, 2.0, d + 0.8, '#d9453a');
  part(up, G.box, '#8f8378', [0.62, 1.5, 0.62], [13.3, 3.25, 5.6]);
  smoke(13.3, 4.1, 5.6);
  // véranda
  part(g, G.box, '#c99a66', [6.2, 0.1, 1.5], [11, 0.05, z0 + d + 0.75]);
  for (const sx of [-1, 1]) part(up, G.cyl6, '#e2362f', [0.08, 2.0, 0.08], [11 + sx * 3.0, 1.1, z0 + d + 1.4]);
  part(up, G.box, '#f6c026', [6.7, 0.07, 1.8], [11, 2.28, z0 + d + 0.95], [0.2, 0, 0]);
  // intérieur : hamac, sound system, platine, planche de surf
  part(g, G.cyl6, '#8a5a3a', [0.07, 1.25, 0.07], [8.1, 0.65, 7.85]);
  part(g, G.box, '#8a5a3a', [0.4, 0.06, 0.1], [8.1, 1.2, z0 + t + 0.06]);
  makeHammock(g, 8.1, 1.15, z0 + t + 0.1, 8.1, 1.15, 7.8, 0.9, 0.5);
  solidBox(7.45, 5.3, 8.75, 7.95);
  makeSpeaker(g, 7.9, 8.9, 1.2, Math.PI / 2 + 0.3);
  part(g, G.box, '#b07a48', [1.5, 0.1, 1.0], [12, 0.8, 8.6]);
  for (const sx of [-0.6, 0.6]) for (const sz of [-0.35, 0.35]) part(g, G.box, '#8a5a3a', [0.09, 0.68, 0.09], [12 + sx, 0.46, 8.6 + sz]);
  part(g, G.cyl, '#241a2e', [0.4, 0.05, 0.4], [11.8, 0.86, 8.6]); part(g, G.cyl, '#e2362f', [0.13, 0.055, 0.13], [11.8, 0.87, 8.6]);
  part(g, G.cyl, '#8a5a3a', [0.22, 0.45, 0.22], [12.8, 0.37, 9.5]);
  solidBox(11.2, 8.05, 12.8, 9.15);
  part(g, G.box, '#a8a29a', [1.5, 1.5, 0.62], [13.3, 0.87, 5.56]);
  part(g, G.box, '#241a2e', [0.8, 0.6, 0.64], [13.3, 0.47, 5.58]);
  const fire = new THREE.Mesh(G.cone, fireMat); fire.scale.set(0.2, 0.36, 0.2); fire.position.set(13.3, 0.38, 5.8); g.add(fire);
  part(g, G.box, '#8a5a3a', [1.75, 0.12, 0.74], [13.3, 1.6, 5.6]);
  solidBox(12.5, 5.25, 14.1, 5.95);
  fireLight = new THREE.PointLight('#ffa860', 1.2, 6, 1.5); fireLight.position.set(13.3, 0.9, 6.3); g.add(fireLight);
  // tapis rasta
  [['#e2362f', 1.5], ['#f6c026', 1.15], ['#2fa84f', 0.8]].forEach(([c, r], k) => part(g, G.cyl, c, [r, 0.02 + k * 0.004, r], [10.4, 0.16 + k * 0.004, 10.1]));
  part(g, G.box, '#8a5a3a', [1.1, 0.6, 0.6], [14.1, 0.45, 10.9]); part(g, G.box, '#f6c026', [0.16, 0.12, 0.04], [14.1, 0.5, 11.22]);
  solidBox(13.5, 10.55, 14.75, 11.25);
  part(g, G.cyl, '#c2553d', [0.2, 0.3, 0.2], [7.7, 0.3, 11.1]); part(g, G.ico, '#2fa84f', [0.3, 0.32, 0.3], [7.7, 0.68, 11.1]);
  windowAt(g, 10.2, y0 + 1.35, z0 + t + 0.03, null);
  // planche de surf contre le mur nord
  const sb = part(g, G.sph, '#17a9c7', [0.28, 0.95, 0.05], [9.6, 1.1, z0 + t + 0.1], [-0.18, 0, 0]);
  part(g, G.box, '#f6c026', [0.5, 0.06, 0.02], [9.6, 1.1, z0 + t + 0.15], [-0.18, 0, 0]);
  part(g, G.box, '#8a5a3a', [1.2, 0.08, 0.3], [8.4, 1.8, 5.42]);
  for (let k = 0; k < 3; k++) part(g, G.box, ['#e2362f', '#f6c026', '#2fa84f'][k], [0.12, 0.3, 0.2], [8.0 + k * 0.16, 1.99, 5.42]);
  part(g, G.box, '#c9a46a', [1.25, 0.03, 0.7], [11, 0.015, 12.55]);
  // coffre d'expédition
  part(g, G.box, '#9a6a42', [1.0, 0.55, 0.7], [13.7, 0.28, 12.9]); part(g, G.box, '#7a5136', [1.08, 0.12, 0.78], [13.7, 0.6, 12.9]);
  for (const sx of [-0.32, 0.32]) part(g, G.box, '#5d6470', [0.07, 0.57, 0.72], [13.7 + sx, 0.28, 12.9]);
  solidBox(13.18, 12.5, 14.22, 13.25);
  reserve(7, 5, 15, 13.4, 0.4);
}

function makeShop(x0, z0, w, d, o) {
  const g = new THREE.Group(); scene.add(g);
  const cx = x0 + w / 2, wh = 2.4, fz = z0 + d;
  part(g, G.box, '#b3a79a', [w + 0.2, 0.25, d + 0.2], [cx, 0.125, z0 + d / 2]);
  part(g, G.box, wallMat(o.wall), [w, wh, d], [cx, 0.25 + wh / 2, z0 + d / 2]);
  for (const sx of [-1, 1]) for (const sz of [0, 1]) part(g, G.box, o.trim, [0.2, wh, 0.2], [cx + sx * w / 2, 0.25 + wh / 2, z0 + sz * d]);
  roofMesh(g, cx, 0.25 + wh, z0 + d / 2, w + 0.8, 1.5, d + 0.8, o.roof);
  part(g, G.box, '#c9a46a', [w - 0.3, 0.08, 1.55], [cx, 0.04, fz + 0.75]);
  windowAt(g, cx - w * 0.3, 1.5, fz + 0.03, o.stripe); windowAt(g, cx + w * 0.3, 1.5, fz + 0.03, o.stripe);
  part(g, G.box, '#2fa84f', [0.9, 1.6, 0.08], [cx, 0.85, fz + 0.04]);
  const aw = new THREE.Group(); aw.position.set(cx, 2.45, fz); aw.rotation.x = 0.36; g.add(aw);
  const n = Math.round(w / 0.5);
  for (let k = 0; k < n; k++) {
    part(aw, G.box, k % 2 ? o.stripe : '#fff4e2', [w / n + 0.002, 0.06, 1.75], [-w / 2 + (k + 0.5) * w / n, 0, 0.87]);
    part(aw, G.cyl, k % 2 ? o.stripe : '#fff4e2', [w / n / 2, 0.06, w / n / 2], [-w / 2 + (k + 0.5) * w / n, 0, 1.75]);
  }
  for (const sx of [-1, 1]) part(g, G.box, o.trim, [0.14, 1.85, 0.14], [cx + sx * (w / 2 - 0.15), 0.92, fz + 1.5]);
  part(g, G.box, o.counter, [w - 1.0, 0.9, 0.5], [cx, 0.45, fz + 1.25]);
  part(g, G.box, o.trim, [w - 0.8, 0.08, 0.62], [cx, 0.93, fz + 1.25]);
  signBoard(g, o.sign, cx, 3.3, fz + 0.42, Math.min(3.6, w - 1.0), 0.85);
  o.goods(g, cx, fz + 1.25);
  solidBox(x0, z0, x0 + w, fz + 0.1); solidBox(cx - (w - 1) / 2, fz + 1.0, cx + (w - 1) / 2, fz + 1.5); reserve(x0, z0, x0 + w, fz + 2.5, 0.5);
  fadeable(g, x0 - 0.4, z0 - 3.4, x0 + w + 0.4, z0 + 0.8);
}

// Beach bar de Zion : toit de chaume, façade rasta, tables et parasols
function makeCafe(x0, z0, w, d) {
  const g = new THREE.Group(); scene.add(g);
  const cx = x0 + w / 2, wh = 2.3, fz = z0 + d;
  part(g, G.box, '#c9a46a', [w + 0.4, 0.2, d + 0.4], [cx, 0.1, z0 + d / 2]);
  part(g, G.box, wallMat('#17b4c4'), [w, wh, d], [cx, 0.2 + wh / 2, z0 + d / 2]);
  RASTA.forEach((c, k) => part(g, G.box, c, [w + 0.04, 0.26, 0.06], [cx, 0.2 + wh - 0.45 - k * 0.26, fz + 0.04]));
  for (const sx of [-1, 1]) for (const sz of [0, 1]) part(g, G.cyl6, '#c9a45a', [0.1, wh + 0.4, 0.1], [cx + sx * w / 2, (wh + 0.4) / 2 + 0.2, z0 + sz * d]);
  roofMesh(g, cx, 0.2 + wh, z0 + d / 2, w + 1.6, 1.7, d + 1.6, '#d9b85f', 'thatch');
  for (let k = 0; k < 14; k++) part(g, G.box, '#c9a24a', [0.26, 0.5, 0.05], [cx - w / 2 - 0.5 + k * ((w + 1) / 13), 0.2 + wh - 0.12, fz + 0.9], [0.5, 0, 0]);
  windowAt(g, cx - w * 0.3, 1.55, fz + 0.03, '#f6c026'); windowAt(g, cx + w * 0.3, 1.55, fz + 0.03, '#f6c026');
  part(g, G.box, '#e2362f', [0.9, 1.6, 0.08], [cx, 1.0, fz + 0.04]);
  part(g, G.box, '#c9a46a', [w - 0.3, 0.08, 1.8], [cx, 0.04, fz + 0.9]);
  part(g, G.box, '#8a5a3a', [w - 1.0, 0.9, 0.5], [cx, 0.45, fz + 1.25]);
  part(g, G.box, '#f6c026', [w - 0.8, 0.08, 0.64], [cx, 0.93, fz + 1.25]);
  part(g, G.box, '#c9a45a', [0.1, 1.4, 0.1], [x0 + 0.4, 0.7, fz + 1.5]); part(g, G.box, '#c9a45a', [0.1, 1.4, 0.1], [x0 + w - 0.4, 0.7, fz + 1.5]);
  signBoard(g, 'Chez Zion', cx, 3.35, fz + 0.9, 3.4, 0.85, 0);
  // comptoir : noix de coco, bouteilles, mixeur
  for (let k = 0; k < 3; k++) { part(g, G.sph, '#6a4426', [0.12, 0.12, 0.12], [cx - 1.8 + k * 0.4, 1.08, fz + 1.25]); part(g, G.cyl6, '#e2362f', [0.012, 0.22, 0.012], [cx - 1.78 + k * 0.4, 1.28, fz + 1.25], [0.2, 0, 0.2]); }
  ['#2fa84f', '#f6c026', '#e2362f', '#17a9c7'].forEach((c, k) => part(g, G.cyl6, c, [0.06, 0.34, 0.06], [cx + 0.4 + k * 0.28, 1.12, fz + 1.2]));
  part(g, G.box, '#dfe6ee', [0.3, 0.4, 0.3], [cx + 1.9, 1.15, fz + 1.2]);
  for (let k = 0; k < 4; k++) { part(g, G.cyl6, '#8a5a3a', [0.16, 0.1, 0.16], [cx - 2.4 + k * 1.6, 0.62, fz + 1.95]); part(g, G.cyl6, '#5d4630', [0.04, 0.55, 0.04], [cx - 2.4 + k * 1.6, 0.3, fz + 1.95]); }
  makeSpeaker(g, x0 - 1.9, fz + 0.6, 1.4, 0.2); makeSpeaker(g, x0 + w + 1.9, fz + 0.6, 1.4, -0.2);
  solidBox(x0, z0, x0 + w, fz + 0.1); solidBox(cx - (w - 1) / 2, fz + 1.0, cx + (w - 1) / 2, fz + 1.5);
  solidBox(x0 - 2.35, fz + 0.2, x0 - 1.45, fz + 1.0); solidBox(x0 + w + 1.45, fz + 0.2, x0 + w + 2.35, fz + 1.0);
  // terrasse
  for (const [tx, tz, col] of [[x0 + 0.6, fz + 5.4, '#e2362f'], [x0 + 4.0, fz + 5.7, '#f6c026'], [x0 + 7.4, fz + 5.4, '#2fa84f']]) {
    part(g, G.cyl6, '#8a5a3a', [0.5, 0.06, 0.5], [tx, 0.78, tz]); part(g, G.cyl6, '#5d4630', [0.06, 0.78, 0.06], [tx, 0.39, tz]);
    part(g, G.cyl6, '#5d4630', [0.04, 2.2, 0.04], [tx, 1.1, tz]);
    part(g, G.cone, col, [1.1, 0.5, 1.1], [tx, 2.28, tz]);
    part(g, G.cone, '#fff4e2', [0.7, 0.57, 0.7], [tx, 2.31, tz]);
    for (const sx of [-1, 1]) { part(g, G.cyl6, '#8a5a3a', [0.14, 0.09, 0.14], [tx + sx * 0.8, 0.45, tz + 0.1]); part(g, G.cyl6, '#5d4630', [0.035, 0.45, 0.035], [tx + sx * 0.8, 0.22, tz + 0.1]); }
    solidBox(tx - 0.5, tz - 0.5, tx + 0.5, tz + 0.5);
  }
  reserve(x0 - 1.5, z0, x0 + w + 1.5, fz + 6.5, 0.4);
  fadeable(g, x0 - 0.4, z0 - 3.4, x0 + w + 0.4, z0 + 0.8);
}

function makeCoop(x0, z0) {
  const g = new THREE.Group(); scene.add(g);
  const w = 4, d = 3, cx = x0 + w / 2, fz = z0 + d;
  for (const sx of [-1.4, 1.4]) for (const sz of [-0.9, 0.9]) part(g, G.cyl6, '#7a5136', [0.1, 0.4, 0.1], [cx + sx, 0.2, z0 + d / 2 + sz]);
  part(g, G.box, wallMat('#f6c026'), [w, 1.7, d], [cx, 1.25, z0 + d / 2]);
  RASTA.forEach((c, k) => part(g, G.box, c, [w + 0.04, 0.2, 0.05], [cx, 0.72 + k * 0.2, fz + 0.03]));
  roofMesh(g, cx, 2.1, z0 + d / 2, w + 0.8, 1.2, d + 0.8, '#2fa84f');
  part(g, G.box, '#2a1c14', [0.8, 0.8, 0.06], [cx, 1.05, fz + 0.04]);               // trappe
  const ramp = part(g, G.box, '#b07a48', [0.8, 0.06, 1.4], [cx, 0.42, fz + 0.65], [0.32, 0, 0]);
  windowAt(g, cx - 1.3, 1.55, fz + 0.03, '#e2362f');
  part(g, G.box, '#c9a46a', [1.0, 0.7, 0.8], [cx + w / 2 + 0.5, 0.35, z0 + 1.2]);   // pondoir extérieur
  part(g, G.box, '#f6c026', [1.1, 0.08, 0.9], [cx + w / 2 + 0.5, 0.74, z0 + 1.2]);
  for (let k = 0; k < 3; k++) part(g, G.ico0, '#fff6e4', [0.1, 0.12, 0.1], [cx + w / 2 + 0.3 + k * 0.2, 0.82, z0 + 1.2]);
  part(g, G.box, '#a8784e', [0.9, 0.1, 0.3], [cx - 1.3, 0.32, fz + 1.0]);               // mangeoire
  part(g, G.box, '#e8c657', [0.7, 0.06, 0.2], [cx - 1.3, 0.38, fz + 1.0]);
  signBoard(g, 'Poulailler', cx, 2.7, fz + 0.3, 2.0, 0.55);
  solidBox(x0, z0, x0 + w + 1.2, fz + 0.1); reserve(x0 - 0.5, z0 - 0.5, x0 + w + 1.5, fz + 2.2);
  fadeable(g, x0 - 0.4, z0 - 3.4, x0 + w + 0.4, z0 + 0.8);
  return g;
}
function makeBarn(x0, z0) {
  const g = new THREE.Group(); scene.add(g);
  const w = 6.5, d = 4.3, cx = x0 + w / 2, fz = z0 + d, wh = 2.4;
  part(g, G.box, '#b3a79a', [w + 0.2, 0.25, d + 0.2], [cx, 0.125, z0 + d / 2]);
  part(g, G.box, wallMat('#d9453a'), [w, wh, d], [cx, 0.25 + wh / 2, z0 + d / 2]);
  for (const sx of [-1, 1]) part(g, G.box, '#fff4e2', [0.2, wh, 0.2], [cx + sx * w / 2, 0.25 + wh / 2, fz]);
  part(g, G.box, '#4a2f1e', [2.2, 1.9, 0.08], [cx, 1.2, fz + 0.04]);
  for (const s of [-1, 1]) { part(g, G.box, '#fff4e2', [0.12, 1.95, 0.1], [cx + s * 1.1, 1.2, fz + 0.06]); }
  part(g, G.box, '#f6c026', [2.4, 0.12, 0.1], [cx, 2.2, fz + 0.06]); part(g, G.box, '#fff4e2', [0.1, 1.95, 0.1], [cx, 1.2, fz + 0.06]);
  for (const [sx, a] of [[-0.55, 0.9], [0.55, -0.9]]) part(g, G.box, '#fff4e2', [0.1, 2.3, 0.08], [cx + sx, 1.2, fz + 0.07], [0, 0, a * 0.5]);
  roofMesh(g, cx, 0.25 + wh, z0 + d / 2, w + 0.9, 2.1, d + 0.8, '#6b7f96');
  windowAt(g, cx, 3.3, fz + 0.03, '#fff4e2');
  part(g, G.cyl6, '#e8c657', [0.4, 0.4, 0.4], [x0 + w + 0.6, 0.4, fz + 0.5]);      // botte de foin
  part(g, G.cyl6, '#e8c657', [0.4, 0.4, 0.4], [x0 + w + 1.1, 0.4, fz + 0.1]);
  signBoard(g, 'Étable', x0 + 1.3, 2.7, fz + 0.2, 1.6, 0.5);
  solidBox(x0, z0, x0 + w, fz + 0.1); solidBox(x0 + w + 0.2, fz - 0.1, x0 + w + 1.5, fz + 0.9); reserve(x0 - 0.5, z0 - 0.5, x0 + w + 1.8, fz + 2.2);
  fadeable(g, x0 - 0.4, z0 - 3.4, x0 + w + 0.4, z0 + 0.8);
  return g;
}

function makeStage() {
  const [cx, cz] = PLAZA_C;
  [[2.4, '#e2362f', 0.3], [2.25, '#f6c026', 0.32], [2.1, '#2fa84f', 0.34], [1.95, '#2a2230', 0.36]].forEach(([r, c, h]) => part(scene, G.cyl, c, [r, h, r], [cx, h / 2, cz]));
  const disc = new THREE.Group(); disc.position.set(cx, 0.39, cz); scene.add(disc); stageObjs.disc = disc;
  part(disc, G.cyl, '#15121b', [1.6, 0.03, 1.6], [0, 0, 0]);
  for (const r of [1.3, 1.05, 0.8]) part(disc, G.cyl, '#27222f', [r, 0.034, r], [0, 0, 0]);
  [['#e2362f', 0.5], ['#f6c026', 0.34], ['#2fa84f', 0.18]].forEach(([c, r], k) => part(disc, G.cyl, c, [r, 0.04 + k * 0.004, r], [0, 0, 0]));
  part(disc, G.box, '#fff4e2', [0.04, 0.045, 0.5], [0, 0.01, -0.35]);
  makeSpeaker(scene, cx - 3.1, cz - 0.9, 1.9, 0.45); makeSpeaker(scene, cx + 3.1, cz - 0.9, 1.9, -0.45);
  solidBox(cx - 3.6, cz - 1.4, cx - 2.6, cz - 0.4); solidBox(cx + 2.6, cz - 1.4, cx + 3.6, cz - 0.4);
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; bulbB.put(cx + Math.cos(a) * 2.45, 0.42, cz + Math.sin(a) * 2.45, 0.08, 0.08, 0.08, 0, ['#ffd84a', '#ff5a5a', '#5ee07a'][k % 3]); }
}
function makeStall(x, z, rotY, col) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  part(g, G.box, '#b07a48', [2.4, 0.9, 0.9], [0, 0.45, 0]); part(g, G.box, '#8a5a3a', [2.5, 0.07, 1.0], [0, 0.93, 0]);
  for (const sx of [-1.15, 1.15]) part(g, G.cyl6, '#8a5a3a', [0.05, 2.1, 0.05], [sx, 1.05, -0.4]);
  for (let k = 0; k < 8; k++) part(g, G.box, k % 2 ? col : '#fff4e2', [0.31, 0.05, 1.5], [-1.1 + k * 0.31, 2.1 - 0.05, 0.05], [0.3, 0, 0]);
  const fruit = [['#f6c026', 'b'], ['#f08a2a', 'm'], ['#6a4426', 'c'], ['#2fa84f', 'p']];
  fruit.forEach(([c, t], k) => { for (let s = 0; s < 4; s++) part(g, G.ico0, c, t === 'b' ? [0.2, 0.07, 0.07] : [0.11, 0.11, 0.11], [-0.9 + k * 0.6 + (s % 2) * 0.12, 1.05 + (s > 1 ? 0.1 : 0), (s % 2 ? 0.1 : -0.1)], t === 'b' ? [0, s * 0.7, 0.3] : undefined); });
  part(g, G.box, '#fff3cf', [0.6, 0.35, 0.03], [0.7, 0.55, 0.47]);
  const wx = Math.cos(rotY) * 1.3, wz = -Math.sin(rotY) * 1.3;
  solidBox(x - 1.3, z - 0.6, x + 1.3, z + 0.6);
  return g;
}
function makeBench(x, z, rotY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  part(g, G.box, '#b07a48', [1.5, 0.08, 0.5], [0, 0.45, 0]); part(g, G.box, '#2fa84f', [1.5, 0.35, 0.08], [0, 0.7, -0.22]);
  for (const s of [-0.6, 0.6]) part(g, G.box, '#e2362f', [0.08, 0.45, 0.45], [s, 0.22, 0]);
  solidBox(x - 0.78, z - 0.3, x + 0.78, z + 0.28);
}
function makeUmbrellaSet(x, z, col) {
  part(scene, G.cyl6, '#5d4630', [0.04, 2.0, 0.04], [x, 1.0, z]);
  part(scene, G.cone, col, [1.15, 0.5, 1.15], [x, 2.05, z]); part(scene, G.cone, '#fff4e2', [0.6, 0.52, 0.6], [x, 2.07, z]);
  part(scene, G.box, col, [0.7, 0.05, 1.6], [x + 0.2, 0.12, z + 1.1], [0, 0.3, 0]);
  part(scene, G.box, '#fff4e2', [0.7, 0.05, 0.4], [x + 0.2, 0.13, z + 0.5], [0, 0.3, 0]);
  solidBox(x - 0.1, z - 0.1, x + 0.1, z + 0.1);
}
function makeSurfboard(x, z, col, tilt = 0.12) {
  part(scene, G.sph, col, [0.26, 1.1, 0.05], [x, 1.1, z], [0, 0, tilt]);
  part(scene, G.box, '#fff4e2', [0.5, 0.06, 0.02], [x - tilt * 0.4, 1.1, z + 0.06], [0, 0, tilt]);
  part(scene, G.box, '#241a2e', [0.04, 0.16, 0.18], [x - tilt * 1.2, 0.2, z]);
  solidBox(x - 0.2, z - 0.1, x + 0.2, z + 0.1);
}

let boat, beam, lhFlag;
function buildWorld() {
  buntB = batch(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.13, 0, 0), new THREE.Vector3(0.13, 0, 0), new THREE.Vector3(0, -0.28, 0)]).setIndex([0, 1, 2]), 900, { cast: false, mat: toon('#ffffff', { side: THREE.DoubleSide }) });
  buntB.geometry.computeVertexNormals();
  bulbB = batch(G.ico0, 400, { cast: false, mat: new THREE.MeshBasicMaterial({ color: '#ffffff' }) }); bulbB.layers.set(1);
  ropeMat = new THREE.LineBasicMaterial({ color: '#3a2a20' });
  buildGround(); buildWater(); makeFarmhouse();

  // Clôtures : poteaux de couleurs, deux lisses
  const postB = batch(G.box, 380), railB = batch(G.box, 700);
  const fenceSeg = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.round(len), horiz = az === bz;
    for (let k = 0; k <= n; k++) postB.put(lerp(ax, bx, k / n), 0.38, lerp(az, bz, k / n), 0.14, 0.76, 0.14, 0, k % 6 === 0 ? RASTA[(k / 6) % 3] : '#b08258');
    for (let k = 0; k < n; k++) for (const y of [0.3, 0.58]) {
      const mx = lerp(ax, bx, (k + 0.5) / n), mz = lerp(az, bz, (k + 0.5) / n);
      railB.put(mx, y, mz, horiz ? len / n : 0.06, 0.08, horiz ? 0.06 : len / n, 0, '#c19463');
    }
    solidBox(Math.min(ax, bx) - 0.1, Math.min(az, bz) - 0.1, Math.max(ax, bx) + 0.1, Math.max(az, bz) + 0.1);
  };
  fenceSeg(4, 3, 34, 3); fenceSeg(4, 3, 4, 45); fenceSeg(4, 45, 18, 45); fenceSeg(21, 45, 34, 45);
  fenceSeg(34, 3, 34, 23.4); fenceSeg(34, 26.6, 34, 45);
  fenceSeg(16.6, 3, 16.6, 12.6); fenceSeg(16.6, 12.6, 24, 12.6); fenceSeg(26.5, 12.6, 34, 12.6);
  postB.flush(); railB.flush();
  signBoard(scene, 'Ton yard', 35.6, 1.3, 22.7, 1.9, 0.52);
  part(scene, G.box, '#5b3a2a', [0.1, 1.0, 0.1], [35.6, 0.5, 22.62]); solidBox(35.4, 22.5, 35.8, 22.8);
  BUILD_G.coop = { g: makeCoop(18, 4.6), site: makeSite(18, 4.6, 5.2, 3, 'Chantier : poulailler') };
  BUILD_G.barn = { g: makeBarn(25.5, 4.3), site: makeSite(25.5, 4.3, 6.5, 4.3, 'Chantier : étable') };
  reserve(16.5, 3.5, 34, 12.8);

  // Épouvantail rasta et drapeau
  part(scene, G.cyl6, '#8a5a3a', [0.05, 1.6, 0.05], [6.6, 0.8, 14.4]); part(scene, G.box, '#8a5a3a', [1.3, 0.06, 0.06], [6.6, 1.2, 14.4]);
  part(scene, G.ico, '#f1d7a8', [0.2, 0.2, 0.2], [6.6, 1.7, 14.4]);
  part(scene, G.cyl, '#2fa84f', [0.24, 0.12, 0.24], [6.6, 1.86, 14.4]); part(scene, G.cyl, '#f6c026', [0.245, 0.06, 0.245], [6.6, 1.83, 14.4]); part(scene, G.cyl, '#e2362f', [0.25, 0.05, 0.25], [6.6, 1.78, 14.4]);
  part(scene, G.cyl, '#e2362f', [0.27, 0.35, 0.18], [6.6, 1.05, 14.4]);
  solidBox(6.4, 14.2, 6.8, 14.6);
  flagPole(5.4, 12.2, 3.8);
  signBoard(scene, 'Agrandir', 15.6, 1.15, 12.97, 1.5, 0.42);
  part(scene, G.box, '#5b3a2a', [0.08, 0.95, 0.08], [15.6, 0.47, 12.92]); solidBox(15.45, 12.8, 15.75, 13.05);

  // Pont sur la rivière
  const plankB = batch(G.box, 900), pierPost = batch(G.cyl6, 240);
  let bx0 = 99, bx1 = 0;
  for (let i = 0; i < W; i++) if (wood[id(i, 24)]) { bx0 = Math.min(bx0, i); bx1 = Math.max(bx1, i + 1); }
  for (let x = bx0 - 0.5; x < bx1 + 0.5; x += 0.34) plankB.put(x + 0.17, 0.02, 25, 0.3, 0.12, 2.3, 0, ['#b48552', '#a87a4a', '#bf9160'][(x * 3 | 0) % 3]);
  for (const z of [23.9, 26.1]) {
    for (let x = bx0 - 0.5, k = 0; x <= bx1 + 0.5; x += 1, k++) pierPost.put(x, 0.35, z, 0.07, 0.75, 0.07, 0, RASTA[k % 3]);
    railB.put((bx0 + bx1) / 2, 0.66, z, bx1 - bx0 + 1, 0.08, 0.08, 0, '#8a5a3a');
  }
  // Jetée
  const buoyCols = ['#e2362f', '#f6c026', '#2fa84f'];
  for (let j = 44; j < H; j++) for (let i = 0; i < W; i++) {
    const k = id(i, j); if (!wood[k] || j < 30) continue;
    for (let s = 0; s < 3; s++) plankB.put(i + 0.5, 0.02, j + 0.17 + s * 0.33, 1.02, 0.12, 0.3, 0, ['#b48552', '#a87a4a', '#bf9160'][(i + j * 3 + s) % 3]);
    const edgeW = !wood[id(i - 1, j)], edgeE = !wood[id(i + 1, j)], edgeS = !wood[id(i, j + 1)];
    if ((edgeW || edgeE) && j % 2 === 0) { const c = RASTA[(j / 2) % 3]; if (edgeW) pierPost.put(i + 0.08, -0.35, j + 0.5, 0.1, 1.1, 0.1, 0, c); if (edgeE) pierPost.put(i + 0.92, -0.35, j + 0.5, 0.1, 1.1, 0.1, 0, c); }
    if (edgeS && i % 2 === 0) pierPost.put(i + 0.5, -0.35, j + 0.92, 0.1, 1.1, 0.1, 0, RASTA[i % 3]);
  }
  plankB.flush(); pierPost.flush();
  for (const [x, z] of [[58.4, 60.5], [66.8, 60.4], [60.2, 61.6], [69.6, 61.8], [56, 56.5]]) { const b = part(scene, G.sph, buoyCols[(x | 0) % 3], [0.28, 0.32, 0.28], [x, -0.18, z]); b.castShadow = false; part(scene, G.cyl6, '#fff', [0.03, 0.3, 0.03], [x, 0.14, z]); }

  // Bateau amarré : coque aux couleurs rasta, mât et voile
  boat = new THREE.Group(); boat.position.set(67.3, -0.22, 54.5); scene.add(boat);
  const hs = new THREE.Shape(); hs.moveTo(-0.75, -1.5); hs.lineTo(0.75, -1.5); hs.lineTo(0.8, 0.7); hs.quadraticCurveTo(0.5, 1.5, 0, 1.75); hs.quadraticCurveTo(-0.5, 1.5, -0.8, 0.7); hs.closePath();
  const hull = new THREE.ExtrudeGeometry(hs, { depth: 0.6, bevelEnabled: false }); hull.rotateX(-Math.PI / 2);
  const hm = new THREE.Mesh(hull, toon('#fff4e2')); hm.castShadow = hm.receiveShadow = true; boat.add(hm);
  RASTA.forEach((c, k) => { const band = new THREE.Mesh(hull, toon(c)); band.scale.set(1.03, 0.16, 1.02); band.position.y = 0.08 + k * 0.17; boat.add(band); });
  part(boat, G.box, '#b48552', [1.3, 0.06, 2.6], [0, 0.5, 0.1]);
  part(boat, G.box, '#17a9c7', [0.9, 0.7, 0.8], [0, 0.85, -0.6]); part(boat, G.box, '#fff4e2', [1.0, 0.08, 0.9], [0, 1.24, -0.6]);
  part(boat, G.cyl6, '#8a5a3a', [0.05, 2.6, 0.05], [0, 1.7, 0.45]);
  const sail = part(boat, G.box, '#fff4e2', [0.03, 1.5, 1.05], [0, 2.15, 0.05]); sail.rotation.y = 0;
  RASTA.forEach((c, k) => part(boat, G.box, c, [0.035, 0.5, 1.05], [0, 2.65 - k * 0.5, 0.05]));
  boat.rotation.y = 0.1;

  // Phare aux couleurs rasta
  const lh = new THREE.Group(); lh.position.set(88.5, 0, 47.5); scene.add(lh);
  part(lh, G.cyl, '#9a948a', [1.3, 0.5, 1.3], [0, 0.25, 0]);
  for (let k = 0; k < 6; k++) { const r0 = 0.95 - k * 0.06; part(lh, G.cyl, RASTA[k % 3], [r0, 1.0, r0], [0, 1.0 + k, 0]); }
  part(lh, G.cyl, '#3d3a46', [0.85, 0.1, 0.85], [0, 6.55, 0]);
  const lantern = new THREE.Mesh(G.cyl, lampMat); lantern.scale.set(0.5, 0.7, 0.5); lantern.position.y = 6.95; lh.add(lantern);
  part(lh, G.cone, '#e2362f', [0.65, 0.55, 0.65], [0, 7.58, 0]);
  windowAt(lh, 0, 2.1, 0.92, null);
  part(lh, G.box, '#4a2f1e', [0.6, 1.0, 0.1], [0, 0.95, 0.96]);
  beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 14, 16, 1, true), beamMat);
  beam.geometry.rotateZ(Math.PI / 2); beam.geometry.translate(7, 0, 0);
  beam.position.set(88.5, 6.95, 47.5); beam.layers.set(1); scene.add(beam);
  solidBox(87.2, 46.2, 89.8, 48.8);
  flagPole(86.2, 49.6, 3.2);

  // Village
  makeHouse(45, 12, 6, 5, { wall: '#38c4be', roof: '#c8553d', trim: '#f6c026', shutter: '#e2362f', win: [-1.8, 1.8], deco: 'chair' });
  makeHouse(45, 31, 6, 5, { wall: '#ff8fa3', roof: '#3f9d57', trim: '#ffffff', shutter: '#2fa84f', win: [-1.8, 1.8], doorX: 0.5, door: '#e2362f', deco: 'plants' });
  makeShop(57, 10, 6, 4, { wall: '#8fd35c', roof: '#d9453a', trim: '#2fa84f', stripe: '#2fa84f', counter: '#9a6a42', sign: 'Graines Irie',
    goods: (g, cx, cz) => {
      const cols = ['#6fbe3f', '#a24b8a', '#e8402e', '#f0902a'];
      for (let k = 0; k < 4; k++) {
        const x = cx - 1.9 + k * 1.27; part(g, G.box, '#b07a48', [0.6, 0.26, 0.4], [x, 1.1, cz]);
        for (let s = 0; s < 3; s++) part(g, G.sph, cols[k], [0.09, 0.09, 0.09], [x - 0.17 + s * 0.17, 1.27, cz + (s % 2) * 0.06]);
      }
    } });
  makeShop(68, 40, 6, 3, { wall: '#4fb3e8', roof: '#e2362f', trim: '#fff4e2', stripe: '#17a9c7', counter: '#6d8a9a', sign: 'Poissonnerie',
    goods: (g, cx, cz) => {
      part(g, G.box, '#f2f8fb', [2.6, 0.12, 0.44], [cx - 0.8, 1.02, cz]);
      const fc = ['#ee6a52', '#2fb6a7', '#f2c83a', '#9fb7a2'];
      for (let k = 0; k < 4; k++) part(g, G.sph, fc[k], [0.26, 0.07, 0.1], [cx - 1.8 + k * 0.65, 1.12, cz], [0, 0.2, 0]);
      part(g, G.cyl, '#8a5a3a', [0.25, 0.5, 0.25], [cx + 1.6, 1.2, cz]);
      part(g, G.cyl6, '#c9a45a', [0.03, 1.2, 0.03], [cx + 2.2, 1.4, cz - 0.1], [0, 0, 0.25]); part(g, G.cyl6, '#c9a45a', [0.03, 1.2, 0.03], [cx + 2.4, 1.4, cz - 0.1], [0, 0, 0.1]);
    } });
  makeShop(76, 14, 6, 4, { wall: '#ff7ac8', roof: '#2fa84f', trim: '#fff4e2', stripe: '#f6c026', counter: '#8a5a3a', sign: 'Dread & Style',
    goods: (g, cx, cz) => {
      for (let k = 0; k < 3; k++) { part(g, G.cyl6, '#5d4630', [0.03, 0.4, 0.03], [cx - 1.6 + k * 0.7, 1.15, cz]); part(g, G.cyl, RASTA[k], [0.2, 0.09, 0.2], [cx - 1.6 + k * 0.7, 1.4, cz]); part(g, G.sph, RASTA[k], [0.14, 0.12, 0.14], [cx - 1.6 + k * 0.7, 1.46, cz]); }
      part(g, G.box, '#2fa84f', [0.5, 0.06, 0.4], [cx + 0.7, 1.0, cz]); part(g, G.box, '#17a9c7', [0.5, 0.06, 0.4], [cx + 0.7, 1.06, cz]); part(g, G.box, '#fbf6ec', [0.5, 0.06, 0.4], [cx + 0.7, 1.12, cz]);
      for (const sx of [1.5, 1.9]) { part(g, G.box, '#241a2e', [0.14, 0.05, 0.03], [cx + sx, 1.0, cz]); }
      part(g, G.cyl6, '#5d4630', [0.03, 1.5, 0.03], [cx + 2.35, 0.9, cz - 0.2]);
      RASTA.forEach((c, k) => part(g, G.box, c, [0.3, 0.55, 0.03], [cx + 2.35, 1.35, cz - 0.2 + k * 0.07]));
    } });
  makeCafe(76, 31, 8, 4);
  makeStage();
  makeStall(66.8, 18.6, 0, '#f6c026'); makeStall(59.4, 29.9, Math.PI, '#e2362f');
  for (const [x, z, r] of [[58.5, 20.2, 0], [68.5, 20.2, 0], [58.5, 27.0, Math.PI], [68.5, 27.0, Math.PI]]) makeBench(x, z, r);
  // Torches tiki, guirlandes et drapeaux
  for (const [x, z] of [[56.3, 17.4], [70.7, 17.4], [56.3, 31.6], [70.7, 31.6], [47.2, 23.3], [82.2, 23.3], [36.6, 23.3], [61.6, 47.3], [65.6, 47.3], [61.6, 58.4], [65.6, 58.4], [9.2, 12.9], [12.8, 12.9], [75.4, 39.6], [84.6, 39.6]]) tikiTorch(x, z, 3.0);
  const hh = 2.95;
  for (const [a, b] of [[[56.3, 17.4], [70.7, 17.4]], [[70.7, 17.4], [70.7, 31.6]], [[70.7, 31.6], [56.3, 31.6]], [[56.3, 31.6], [56.3, 17.4]], [[61.6, 47.3], [65.6, 47.3]], [[61.6, 47.3], [61.6, 58.4]], [[65.6, 47.3], [65.6, 58.4]], [[61.6, 58.4], [65.6, 58.4]], [[9.2, 12.9], [12.8, 12.9]], [[75.4, 39.6], [84.6, 39.6]]])
    bunting(a[0], hh, a[1], b[0], hh, b[1], 0.55);
  bunting(56.3, hh, 17.4, 70.7, hh, 31.6, 1.2, true); bunting(70.7, hh, 17.4, 56.3, hh, 31.6, 1.2, true);
  bunting(47.2, hh, 23.3, 56.3, hh, 31.6, 0.8); bunting(70.7, hh, 17.4, 82.2, hh, 23.3, 0.8);
  flagPole(54.6, 24.0, 4.2); flagPole(72.4, 24.0, 4.2);
  // Plage : parasols et planches de surf
  makeUmbrellaSet(55.5, 47.9, '#e2362f'); makeUmbrellaSet(71.5, 48.2, '#f6c026'); makeUmbrellaSet(78.5, 48.4, '#17a9c7');
  [['#e2362f', 52.3], ['#f6c026', 52.9], ['#2fa84f', 53.5], ['#17a9c7', 74.6], ['#ff7ac8', 75.2]].forEach(([c, x], k) => makeSurfboard(x, 47.1 + (k % 2) * 0.3, c, (k % 2 ? -1 : 1) * 0.12));
  for (const [x, z, r] of [[66.4, 46.6, 0.2], [67.0, 47.1, -0.3], [75.2, 44.6, 0.1]]) { part(scene, G.box, '#b07a48', [0.6, 0.55, 0.6], [x, 0.28, z], [0, r, 0]); solidBox(x - 0.35, z - 0.35, x + 0.35, z + 0.35); }
  for (const [x, z] of [[60.9, 46.4], [75.6, 45.6]]) { part(scene, G.cyl, '#8a5a3a', [0.3, 0.7, 0.3], [x, 0.35, z]); part(scene, G.cyl, '#e2362f', [0.31, 0.06, 0.31], [x, 0.55, z]); solidBox(x - 0.32, z - 0.32, x + 0.32, z + 0.32); }
  signBoard(scene, 'Irie Bay', 44.8, 1.3, 22.7, 2.2, 0.6);
  part(scene, G.box, '#5b3a2a', [0.1, 1.0, 0.1], [44.8, 0.5, 22.62]); solidBox(44.6, 22.5, 45.0, 22.8);
  reserve(55, 17, 72, 32);
  buntB.flush(); bulbB.flush();
  scatterNature();
}
