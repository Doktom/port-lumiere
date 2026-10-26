// =====================================================================
// Personnages, villageois et animaux
// =====================================================================
function makeCharacter(o) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const skin = o.skin || '#a8683f';
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.1, 0.34, 0); legR.position.set(0.1, 0.34, 0); body.add(legL, legR);
  for (const L of [legL, legR]) {
    if (o.shorts) { part(L, G.box, o.pants, [0.15, 0.17, 0.16], [0, -0.085, 0]); part(L, G.box, skin, [0.12, 0.15, 0.12], [0, -0.23, 0]); }
    else part(L, G.box, o.pants, [0.13, 0.32, 0.14], [0, -0.16, 0]);
    part(L, G.box, o.shoe || '#6b4a3a', [0.15, 0.07, 0.21], [0, -0.31, 0.03]);
  }
  if (o.skirt) part(body, G.cone, o.skirt, [0.3, 0.42, 0.3], [0, 0.3, 0]);
  const torsoCol = o.shirt;
  if (o.band) {  // maillot rasta : trois bandes horizontales
    [['#e2362f', 0.64], ['#f6c026', 0.5], ['#2fa84f', 0.36]].forEach(([c, y]) => part(body, G.cyl, c, [0.245, 0.14, 0.205], [0, y, 0]));
  } else part(body, G.cyl, torsoCol, [0.24, 0.4, 0.2], [0, 0.56, 0]);
  if (o.pattern === 'flower') for (const [x, y, z, c] of [[-0.12, 0.62, 0.19, '#ff7ac8'], [0.1, 0.52, 0.2, '#f6c026'], [0.0, 0.66, 0.2, '#fff'], [-0.06, 0.45, 0.2, '#e2362f'], [0.14, 0.68, 0.17, '#ff7ac8']]) part(body, G.ico0, c, [0.04, 0.04, 0.02], [x, y, z]);
  if (o.pattern === 'surf') part(body, G.box, '#fff', [0.46, 0.05, 0.02], [0, 0.55, 0.2]);
  if (o.apron) part(body, G.box, o.apron, [0.34, 0.4, 0.04], [0, 0.48, 0.2]);
  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.3, 0.72, 0); body.add(a);
    part(a, G.cyl, o.bare ? skin : torsoCol, [0.065, 0.32, 0.065], [0, -0.15, 0]); part(a, G.sph, skin, [0.07, 0.07, 0.07], [0, -0.34, 0]);
    arms.push(a);
  }
  const head = new THREE.Group(); head.position.y = 1.0; body.add(head);
  part(head, G.sph, skin, [0.25, 0.24, 0.24], [0, 0, 0]);
  for (const s of [-1, 1]) { part(head, G.box, '#241a2e', [0.045, 0.075, 0.02], [s * 0.085, 0.0, 0.232]); const ck = part(head, G.sph, '#e88a7a', [0.045, 0.03, 0.02], [s * 0.15, -0.06, 0.2]); ck.castShadow = false; }
  const hc = o.hair || '#1c1410';
  switch (o.hairStyle) {
    case 'short': part(head, G.sph, hc, [0.265, 0.2, 0.262], [0, 0.07, -0.025]); break;
    case 'afro': part(head, G.sph, hc, [0.36, 0.34, 0.34], [0, 0.1, -0.03]); break;
    case 'bun': part(head, G.sph, hc, [0.265, 0.2, 0.262], [0, 0.07, -0.025]); part(head, G.sph, hc, [0.12, 0.12, 0.12], [0, 0.24, -0.16]); break;
    case 'long': part(head, G.sph, hc, [0.265, 0.2, 0.262], [0, 0.07, -0.025]); part(head, G.box, hc, [0.44, 0.38, 0.14], [0, -0.1, -0.17]); break;
    case 'dreads': {
      part(head, G.sph, hc, [0.262, 0.19, 0.258], [0, 0.07, -0.03]);
      for (let k = 0; k < 11; k++) {
        const a = k / 11 * Math.PI * 2, r = 0.2, len = 0.34 + ((k * 37) % 5) * 0.05;
        if (Math.cos(a) > 0.55 && Math.sin(a) > 0) continue;
        part(head, G.cyl6, hc, [0.036, len, 0.036], [Math.sin(a) * r, 0.0 - len / 2 + 0.08, -Math.abs(Math.cos(a)) * r * 0.9 - 0.02], [0.05 * Math.cos(a), 0, 0.05 * Math.sin(a)]);
      }
      break;
    }
  }
  if (o.beard) part(head, G.box, hc, [0.3, 0.13, 0.08], [0, -0.13, 0.2]);
  if (o.hat === 'straw') { part(head, G.cyl, '#ecc86a', [0.42, 0.03, 0.42], [0, 0.17, 0]); part(head, G.cyl, '#ecc86a', [0.22, 0.16, 0.22], [0, 0.26, 0]); part(head, G.cyl, '#e2362f', [0.225, 0.045, 0.225], [0, 0.2, 0]); }
  if (o.hat === 'cap') { part(head, G.cyl, '#2b3f6b', [0.27, 0.13, 0.27], [0, 0.2, 0]); part(head, G.box, '#2b3f6b', [0.3, 0.03, 0.16], [0, 0.15, 0.25]); part(head, G.cyl, '#fbf6ec', [0.275, 0.03, 0.275], [0, 0.17, 0]); }
  if (o.hat === 'tam') {
    part(head, G.sph, '#2fa84f', [0.34, 0.24, 0.34], [0, 0.17, -0.04]);
    [['#e2362f', 0.1], ['#f6c026', 0.17]].forEach(([c, y]) => part(head, G.cyl, c, [0.285, 0.04, 0.285], [0, y, -0.03]));
    part(head, G.cyl, '#241a2e', [0.27, 0.04, 0.27], [0, 0.07, -0.02]);
  }
  if (o.hat === 'bandana') { part(head, G.sph, '#e2362f', [0.268, 0.19, 0.265], [0, 0.08, -0.02]); part(head, G.box, '#e2362f', [0.12, 0.12, 0.05], [0, 0.07, -0.26], [0, 0, 0.7]); }
  if (o.hat === 'wrap') { RASTA.forEach((c, k) => part(head, G.cyl, c, [0.28 - k * 0.025, 0.085, 0.28 - k * 0.025], [0, 0.1 + k * 0.08, -0.02], [0.08 * (k % 2 ? 1 : -1), 0, 0])); part(head, G.sph, '#e2362f', [0.09, 0.09, 0.09], [0, 0.35, -0.02]); }
  if (o.hat === 'crown') for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; part(head, G.ico0, ['#ff7ac8', '#f6c026', '#fff', '#e2362f'][k % 4], [0.065, 0.065, 0.065], [Math.cos(a) * 0.25, 0.16, Math.sin(a) * 0.25]); }
  if (o.glasses === 'round') { for (const s of [-1, 1]) part(head, G.cyl, '#241a2e', [0.07, 0.025, 0.07], [s * 0.095, 0.01, 0.245], [Math.PI / 2, 0, 0]); part(head, G.box, '#241a2e', [0.06, 0.015, 0.015], [0, 0.02, 0.25]); }
  if (o.glasses === 'aviator') { for (const s of [-1, 1]) part(head, G.cyl, '#e2362f', [0.085, 0.025, 0.07], [s * 0.1, 0.0, 0.245], [Math.PI / 2, 0, 0]); part(head, G.box, '#f6c026', [0.06, 0.015, 0.015], [0, 0.02, 0.25]); }
  const socket = new THREE.Group(); socket.position.y = -0.34; arms[1].add(socket);
  return { g, body, legL, legR, armL: arms[0], armR: arms[1], head, socket };
}
const SHIRT_LOOK = {
  shirt_tank: { shirt: '#f6c026', bare: true },
  shirt_white: { shirt: '#fbf6ec' },
  shirt_flower: { shirt: '#17a9c7', pattern: 'flower' },
  shirt_surf: { shirt: '#2f8fc0', pattern: 'surf' },
  shirt_rasta: { shirt: '#2fa84f', band: true },
};
function playerLook() {
  const e = S.eq;
  return { skin: '#a8683f', hair: '#1c1410', hairStyle: 'dreads', pants: '#2fa84f', shorts: true, shoe: '#e2362f',
    hat: e.hat === 'hat_none' ? null : e.hat.slice(4), glasses: e.gl === 'gl_none' ? null : e.gl.slice(3), ...SHIRT_LOOK[e.shirt] };
}
function makeTools(socket) {
  const t = {};
  const tier = id => toolTier(id), metal = ['#aeb8c6', '#dfe6ee', '#f6c026'];
  t.hoe = new THREE.Group(); part(t.hoe, G.cyl6, ['#b07a48', '#8f9aa8', '#d9a21b'][tier('hoe')], [0.03, 1.0, 0.03], [0, -0.38, 0]); part(t.hoe, G.box, metal[tier('hoe')], [0.2, 0.05, 0.26], [0, -0.86, -0.12]);
  t.can = new THREE.Group(); const cc = ['#2fb6a7', '#7fa5c4', '#f6c026'][tier('can')]; part(t.can, G.cyl, cc, [0.15, 0.24, 0.15], [0, -0.16, 0.06]); part(t.can, G.cyl6, cc, [0.025, 0.28, 0.025], [0, -0.16, 0.25], [1.0, 0, 0]);
  t.rod = new THREE.Group(); part(t.rod, G.cyl6, ['#c99a5a', '#4fb0a8', '#f6c026'][tier('rod')], [0.022, 1.7, 0.022], [0, -0.8, 0]); part(t.rod, G.cyl, '#8d96a3', [0.05, 0.05, 0.05], [0.06, -0.12, 0], [0, 0, Math.PI / 2]);
  t.seed = new THREE.Group(); part(t.seed, G.sph, '#d8c08a', [0.1, 0.12, 0.1], [0, -0.06, 0]);
  for (const k in t) { t[k].visible = false; socket.add(t[k]); }
  return t;
}
let player, tools, bobber, fishLine;
function buildPlayer() {
  if (player) scene.remove(player.g);
  player = makeCharacter(playerLook()); scene.add(player.g);
  tools = makeTools(player.socket);
  tools.rodTip = v => { v.set(0, -1.65, 0); tools.rod.localToWorld(v); return v; };
}

// ---------- Villageois
const npcs = [];
function buildNPCs() {
  for (const d of NPC_DEFS) {
    const c = makeCharacter(d.look); scene.add(c.g);
    if (d.scale) c.g.scale.setScalar(d.scale);
    const n = { ...d, ...c, x: 0, z: 0, path: null, pi: 0, hidden: true, cur: null, walk: 0, talkT: 0, face: 0, pause: 0, homeSpot: d.shop ? `${d.id}_home` : (d.id === 'ivy' || d.id === 'delroy' ? 'ivy_home' : 'ivy_home') };
    c.g.visible = false; npcs.push(n);
  }
}
function npcWanted(n) {
  let spot = n.sched[0][1];
  for (const [t, s] of n.sched) if (S.time >= t) spot = s;
  if (!n.shop && wet(S.weather) && S.time < 1200) spot = n.homeSpot;
  return spot;
}
function placeNPC(n, spot) {
  const [x, z] = SPOTS[spot]; n.x = x; n.z = z; n.cur = spot; n.path = null;
  n.hidden = spot.endsWith('_home'); n.g.visible = !n.hidden; n.g.position.set(x, 0, z);
  n.face = spot.endsWith('_counter') ? 0 : Math.PI * (rnd() < 0.5 ? 0.15 : -0.15);
  n.g.rotation.y = n.face;
}
function placeAllNPCs() { for (const n of npcs) placeNPC(n, npcWanted(n)); }
function updateNPCs(dt, tsec) {
  for (const n of npcs) {
    const want = npcWanted(n);
    if (want !== n.cur && !(S.modal && S.modal.startsWith('npc:' + n.id))) {
      if (n.hidden) { const [hx, hz] = SPOTS[n.homeSpot]; n.x = hx; n.z = hz; n.hidden = false; n.g.visible = true; }
      n.path = findPath(n.x, n.z, ...SPOTS[want]); n.pi = 0; n.cur = want; n.pause = 0;
    }
    if (n.hidden) continue;
    let moving = false;
    if (n.talkT > 0) { n.talkT -= dt; n.face = Math.atan2(P.x - n.x, P.z - n.z); }
    else if (n.path && n.pi < n.path.length) {
      const [tx, tz] = n.path[n.pi], dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz);
      if (d < 0.07) { n.pi++; if (n.pi >= n.path.length) { n.path = null; if (n.cur.endsWith('_home')) { n.hidden = true; n.g.visible = false; } else n.face = n.cur.endsWith('_counter') ? 0 : n.face; } }
      else { const sp = (n.id === 'delroy' ? 2.0 : 1.5) * dt; n.x += dx / d * Math.min(sp, d); n.z += dz / d * Math.min(sp, d); n.face = Math.atan2(dx, dz); moving = true; }
    }
    n.walk = moving ? n.walk + dt * 7 : 0;
    const sw = Math.sin(n.walk) * (moving ? 0.55 : 0);
    n.legL.rotation.x = sw; n.legR.rotation.x = -sw; n.armL.rotation.x = -sw * 0.8; n.armR.rotation.x = sw * 0.8;
    const idle = (!moving && n.id !== 'zion') ? Math.sin(tsec * 2 + n.x) * 0.012 : 0;
    n.body.position.y = moving ? Math.abs(Math.sin(n.walk)) * 0.04 : idle;
    if (!moving && n.id === 'zion') { n.body.position.y = Math.abs(Math.sin(tsec * Math.PI * 1.3)) * 0.03; n.head.rotation.z = Math.sin(tsec * Math.PI * 1.3) * 0.12; }
    n.g.position.set(n.x, wood[id(Math.floor(n.x), Math.floor(n.z))] ? 0.08 : 0, n.z);
    n.g.rotation.y += angDiff(n.face, n.g.rotation.y) * Math.min(1, dt * 10);
  }
}

// ---------- Animaux de ferme
const PEN = { x0: 17.6, x1: 33.0, z0: 9.5, z1: 12.1 };
function makeChicken(col) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  part(body, G.ico, col, [0.17, 0.15, 0.22], [0, 0.22, 0]);
  part(body, G.ico, col, [0.07, 0.1, 0.07], [0, 0.32, -0.2], [-0.5, 0, 0]);
  for (const s of [-1, 1]) part(body, G.ico0, col === '#fff7e6' ? '#efe2c8' : '#5b3a22', [0.03, 0.09, 0.15], [s * 0.15, 0.22, 0]);
  const head = new THREE.Group(); head.position.set(0, 0.4, 0.17); body.add(head);
  part(head, G.sph, col, [0.075, 0.08, 0.075], [0, 0, 0]);
  part(head, G.box, '#e2362f', [0.025, 0.05, 0.07], [0, 0.085, 0]); part(head, G.cone, '#f08a2a', [0.03, 0.07, 0.03], [0, -0.01, 0.1], [Math.PI / 2, 0, 0]);
  part(head, G.ico0, '#e2362f', [0.02, 0.035, 0.02], [0, -0.075, 0.07]);
  for (const s of [-1, 1]) part(head, G.ico0, '#241a2e', [0.016, 0.016, 0.016], [s * 0.06, 0.02, 0.055]);
  for (const s of [-1, 1]) { part(body, G.cyl6, '#f08a2a', [0.012, 0.18, 0.012], [s * 0.06, 0.09, 0]); part(body, G.box, '#f08a2a', [0.05, 0.015, 0.07], [s * 0.06, 0.012, 0.02]); }
  return { g, body, head };
}
function makeCow() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const cream = '#fbf3e0', dark = ['#4a3328', '#241a2e'][(rnd() * 2) | 0];
  part(body, G.ico, cream, [0.4, 0.36, 0.72], [0, 0.78, 0]);
  for (const [x, y, z, sx, sy, sz] of [[0.28, 0.9, 0.12, 0.2, 0.2, 0.26], [-0.3, 0.8, -0.2, 0.18, 0.2, 0.22], [0.2, 0.7, -0.4, 0.14, 0.14, 0.14]]) part(body, G.ico, dark, [sx, sy, sz], [x, y, z]);
  const head = new THREE.Group(); head.position.set(0, 0.92, 0.7); body.add(head);
  part(head, G.ico, cream, [0.2, 0.2, 0.24], [0, 0, 0]); part(head, G.ico, '#ffb7c0', [0.15, 0.1, 0.1], [0, -0.1, 0.18]);
  for (const s of [-1, 1]) { part(head, G.ico0, cream, [0.08, 0.04, 0.05], [s * 0.2, 0.08, -0.02]); part(head, G.cone, '#e8dcc0', [0.03, 0.12, 0.03], [s * 0.12, 0.2, -0.04], [0, 0, -s * 0.4]); part(head, G.ico0, '#241a2e', [0.025, 0.025, 0.025], [s * 0.12, 0.05, 0.16]); }
  part(head, G.cyl, '#e2362f', [0.17, 0.06, 0.17], [0, -0.1, -0.06], [0.4, 0, 0]); part(head, G.sph, '#f6c026', [0.04, 0.04, 0.04], [0, -0.2, 0.0]);
  for (const [x, z] of [[-0.18, 0.4], [0.18, 0.4], [-0.18, -0.4], [0.18, -0.4]]) { part(body, G.cyl6, cream, [0.07, 0.5, 0.07], [x, 0.26, z]); part(body, G.cyl6, '#241a2e', [0.075, 0.07, 0.075], [x, 0.04, z]); }
  part(body, G.cyl6, cream, [0.02, 0.5, 0.02], [0, 0.85, -0.78], [0.3, 0, 0]); part(body, G.ico0, dark, [0.05, 0.08, 0.05], [0, 0.6, -0.86]);
  part(body, G.ico, '#ffb7c0', [0.12, 0.08, 0.1], [0, 0.46, -0.3]);
  return { g, body, head };
}
const animalMeshes = new Map();
function spawnAnimalMesh(a) {
  const m = a.type === 'poule' ? makeChicken(['#fff7e6', '#d9894a', '#7a4a2e', '#2a2a2a', '#f6c026'][a.col % 5]) : makeCow();
  scene.add(m.g);
  const o = { ...m, a, x: rr(PEN.x0, PEN.x1), z: rr(PEN.z0, PEN.z1), tx: 0, tz: 0, wait: rnd() * 2, face: rnd() * 6, walk: 0, peck: 0 };
  o.tx = o.x; o.tz = o.z; o.g.position.set(o.x, 0, o.z);
  animalMeshes.set(a.id, o); return o;
}
function syncAnimalMeshes() {
  for (const a of S.animals) if (!animalMeshes.has(a.id)) spawnAnimalMesh(a);
  for (const [k, o] of animalMeshes) if (!S.animals.find(a => a.id === k)) { scene.remove(o.g); animalMeshes.delete(k); }
}
function animalsOutside() { return S.time >= 390 && S.time < 1200 && !wet(S.weather); }
function updateAnimals(dt, tsec) {
  const out = animalsOutside();
  for (const o of animalMeshes.values()) {
    o.g.visible = out;
    if (!out) continue;
    const cow = o.a.type === 'vache', sp = cow ? 0.45 : 0.75;
    let moving = false;
    if (o.wait > 0) o.wait -= dt;
    else {
      const dx = o.tx - o.x, dz = o.tz - o.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { o.wait = (cow ? 2.5 : 1.0) + rnd() * 3; o.tx = rr(PEN.x0, PEN.x1); o.tz = rr(PEN.z0, PEN.z1); o.peck = rnd() < 0.6 ? 1.2 : 0; }
      else { o.x += dx / d * sp * dt; o.z += dz / d * sp * dt; o.face = Math.atan2(dx, dz); moving = true; }
    }
    o.walk = moving ? o.walk + dt * (cow ? 5 : 11) : o.walk;
    o.body.position.y = moving ? Math.abs(Math.sin(o.walk)) * (cow ? 0.015 : 0.03) : 0;
    o.body.rotation.z = moving ? Math.sin(o.walk) * (cow ? 0.02 : 0.1) : 0;
    if (o.peck > 0 && !moving) { o.peck -= dt; o.head.rotation.x = cow ? 0.5 : 0.9 * Math.abs(Math.sin(tsec * 9)); } else o.head.rotation.x = 0;
    o.g.position.set(o.x, 0, o.z); o.g.rotation.y += angDiff(o.face, o.g.rotation.y) * Math.min(1, dt * 6);
  }
}
