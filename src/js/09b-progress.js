// =====================================================================
// Progression RPG : niveau, talents, qualité, débris, artisanat,
// agrandissement de la ferme, bâtiments à construire, zones verrouillées
// =====================================================================
const totalXP = () => Object.values(S.xp).reduce((a, b) => a + b, 0);
const plXP = l => 45 * (l - 1) * (l - 1);
const plvl = () => Math.min(MAX_PL, 1 + Math.floor(Math.sqrt(totalXP() / 45)));
function maxEn() { return 100 + 6 * (plvl() - 1); }
const tal = tid => S.talents[tid] || 0;
function talentPoints() { let p = 0; for (const sk in SKILLS) p += lvl(sk) - 1; for (const k in S.talents) p -= S.talents[k]; return p; }
function learnTalent(tid) { if (talentPoints() <= 0 || tal(tid) >= 3) return; S.talents[tid] = tal(tid) + 1; sfx('level'); }
function rollQuality(bonus = 0) {
  const r = rnd(), g = 0.02 + 0.02 * (lvl('farm') - 1) + bonus * 0.4 + tal('qualite') * 0.03, s = 0.1 + 0.04 * (lvl('farm') - 1) + bonus + tal('qualite') * 0.06;
  return r < g ? 2 : r < g + s ? 1 : 0;
}
const sellOf = (itemId, qa = 0) => Math.round((ITEMS[itemId].sell || 0) * QUAL[qa || 0].mult * (ITEMS[itemId].crafted ? 1 + 0.05 * tal('marchand') : 1) * (S.story.flags.awake ? 1.1 : 1));
const fieldRect = () => FARM_RECTS[S.farmLvl];
const inFarm = (i, j) => { const r = fieldRect(); return i >= r[0] && i <= r[2] && j >= r[1] && j <= r[3]; };

// ---------- Débris et ressources (branches, broussailles, souches, rochers)
const nodeMeshes = new Map();
const NODE_SPOTS = { farm: [], wild: [], beach: [] };
function nodeMesh(type) {
  const g = new THREE.Group();
  if (type === 'branche') { for (let k = 0; k < 3; k++) part(g, G.cyl6, '#8a5a3a', [0.05, 0.85, 0.05], [(k - 1) * 0.12, 0.06, 0], [Math.PI / 2, 0, (k - 1) * 0.6]); part(g, G.ico0, '#3da84a', [0.14, 0.08, 0.14], [0.25, 0.08, 0.1]); }
  else if (type === 'broussaille') { part(g, G.ico, '#2f8a3c', [0.38, 0.26, 0.38], [0, 0.18, 0]); part(g, G.ico, '#3da84a', [0.26, 0.2, 0.26], [0.2, 0.22, 0.12]); for (let k = 0; k < 3; k++) part(g, G.cone4, '#58b448', [0.05, 0.4, 0.05], [(k - 1) * 0.15, 0.25, -0.15]); }
  else if (type === 'souche') { part(g, G.cyl, '#8a5a3a', [0.32, 0.36, 0.32], [0, 0.18, 0]); part(g, G.cyl, '#e8c79a', [0.27, 0.02, 0.27], [0, 0.37, 0]); for (let k = 0; k < 4; k++) part(g, G.cyl6, '#7a4b2e', [0.07, 0.4, 0.07], [Math.cos(k * 1.57) * 0.32, 0.05, Math.sin(k * 1.57) * 0.32], [Math.sin(k * 1.57) * 1.2, 0, -Math.cos(k * 1.57) * 1.2]); }
  else if (type === 'rocher') { part(g, G.rock, '#a9a39b', [0.4, 0.3, 0.36], [0, 0.2, 0]); part(g, G.rock, '#948e88', [0.2, 0.16, 0.2], [0.3, 0.1, 0.18]); }
  return g;
}
const nodeAt = k => S.nodes.find(n => n.k === k);
function spawnNodeMesh(n) {
  const i = n.k % W, j = (n.k / W) | 0, m = nodeMesh(n.type);
  m.position.set(i + 0.5, 0, j + 0.5); m.rotation.y = hash2(i, j) * 6.28; scene.add(m); nodeMeshes.set(n.k, m);
  const dec = tileDecor.get(n.k); if (dec) { for (const [b, q] of dec) b.hide(q); tileDecor.delete(n.k); }
}
function addNode(k, type) { if (nodeAt(k) || plots.has(k) || placedAt(k)) return; const n = { k, type, hp: DEBRIS[type].hp }; S.nodes.push(n); spawnNodeMesh(n); }
function clearNodeMeshes() { for (const m of nodeMeshes.values()) scene.remove(m); nodeMeshes.clear(); }
function rebuildNodes() { clearNodeMeshes(); for (const n of S.nodes) spawnNodeMesh(n); }
function initNodeSpots() {
  const R = FARM_RECTS[3];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = id(i, j), t = tiles[k];
    if (t === GRASS && i >= R[0] && i <= R[2] && j >= R[1] && j <= R[3] && !occ[k]) NODE_SPOTS.farm.push(k);
    else if (t === GRASS && !used[k] && i > 3 && j > 3 && i < W - 4 && !(i >= 16 && i <= 34 && j <= 12)) NODE_SPOTS.wild.push(k);
    else if (t === SAND && !occ[k] && !isWater(tileAt(i, j + 1)) && !(i >= 58 && i <= 68) && !(i >= 84)) NODE_SPOTS.beach.push(k);
  }
}
// Nouvelle partie : la vieille ferme de Tonton Dub est envahie
function seedFarmDebris() {
  S.nodes = []; clearNodeMeshes();
  const R0 = FARM_RECTS[0];
  for (const k of NODE_SPOTS.farm) {
    const i = k % W, j = (k / W) | 0, start = i >= R0[0] && i <= R0[2] && j >= R0[1] && j <= R0[3];
    const r = hash2(i * 1.3, j * 2.1);
    if (r < (start ? 0.06 : 0.17)) addNode(k, r < 0.03 ? 'souche' : r < 0.07 ? 'rocher' : r < 0.12 ? 'broussaille' : 'branche');
  }
}
function dailyNodes() {
  const cap = 140; let n = 0;
  const pickFrom = (list, type, count) => { for (let q = 0; q < count * 4 && n < count; q++) { const k = list[(dayRand(S.day, q * 7.3 + type.length) * list.length) | 0]; if (k != null && !nodeAt(k) && S.nodes.length < cap) { addNode(k, type); n++; } } n = 0; };
  pickFrom(NODE_SPOTS.wild, 'branche', 5); pickFrom(NODE_SPOTS.wild, 'broussaille', 4); pickFrom(NODE_SPOTS.beach, 'rocher', 3);
  const R = fieldRect(); pickFrom(NODE_SPOTS.farm.filter(k => { const i = k % W, j = (k / W) | 0; return !(i >= R[0] && i <= R[2] && j >= R[1] && j <= R[3]); }), 'broussaille', 2);
}
function hitNode(n, slot) {
  const d = DEBRIS[n.type], tier = slot.t || 0;
  if (d.tool !== slot.id) { toast(`${d.name} : il faut la ${d.tool === 'machette' ? 'machette' : 'pioche'}.`); return; }
  if (!spend(d.en * (1 - 0.15 * tal('bucheron')))) return;
  anim('hoe', 0.32); n.hp -= 1 + tier; sfx(d.tool === 'pioche' ? 'thud' : 'hoe');
  const m = nodeMeshes.get(n.k); if (m) { m.scale.setScalar(0.85); setTimeout(() => m.scale.setScalar(1), 90); }
  if (n.hp > 0) return;
  const [res, a, b] = d.drop; let q = a + Math.floor(rnd() * (b - a + 1)) + tier + (rnd() < tal('cueilleur') * 0.2 ? 1 : 0);
  const got = [[res, q]];
  if (n.type === 'rocher' && rnd() < 0.04 + 0.03 * tal('nez') + 0.03 * tier + (lvl('forage') >= 5 ? 0.04 : 0)) got.push(['quartz', 1]);
  if (n.type === 'broussaille' && rnd() < 0.3) got.push(['bois', 1]);
  for (const [r2, q2] of got) if (!addItem(r2, q2)) toast('Ton sac est plein.');
  floater(got.map(([r2, q2]) => `+${q2} ${ITEMS[r2].name}`).join(' · '), got[got.length - 1][0]);
  S.nodes.splice(S.nodes.indexOf(n), 1); if (m) scene.remove(m); nodeMeshes.delete(n.k);
  xpGain('forage', 4 + d.hp); bump('debris');
}

// ---------- Objets posés (arroseurs)
const placedMeshes = new Map();
const placedAt = k => S.placed.find(p => p.k === k);
function sprinklerMesh() {
  const g = new THREE.Group();
  part(g, G.box, '#8a5a3a', [0.4, 0.12, 0.4], [0, 0.06, 0]); part(g, G.cyl6, '#7fa5c4', [0.05, 0.4, 0.05], [0, 0.3, 0]);
  const head = new THREE.Group(); head.position.y = 0.52; g.add(head);
  part(head, G.box, '#2fb6a7', [0.36, 0.05, 0.05], [0, 0, 0]); part(head, G.sph, '#f6c026', [0.06, 0.06, 0.06], [0, 0.04, 0]);
  g.userData.head = head; return g;
}
function spawnPlaced(p) { const i = p.k % W, j = (p.k / W) | 0, m = sprinklerMesh(); m.position.set(i + 0.5, 0, j + 0.5); scene.add(m); placedMeshes.set(p.k, m); }
function rebuildPlaced() { for (const m of placedMeshes.values()) scene.remove(m); placedMeshes.clear(); for (const p of S.placed) spawnPlaced(p); }
function runSprinklers() {
  for (const p of S.placed) { const i = p.k % W, j = (p.k / W) | 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const pl = plots.get(id(i + di, j + dj)); if (pl) pl.watered = true; } }
}

// Outils et objets supplémentaires (renvoie true si l'action est traitée)
function useExtra(slot, it, tier, ti, tj, k, p) {
  const n = nodeAt(k);
  if (slot.id === 'machette' || slot.id === 'pioche') {
    if (n) { hitNode(n, slot); return true; }
    if (slot.id === 'pioche' && placedAt(k)) { const pl = placedAt(k); S.placed.splice(S.placed.indexOf(pl), 1); scene.remove(placedMeshes.get(k)); placedMeshes.delete(k); addItem('arroseur', 1); sfx('thud'); return true; }
    if (slot.id === 'pioche' && p && !p.crop) { scene.remove(p.soil); plots.delete(k); sfx('thud'); return true; }
    anim('hoe', 0.3); sfx('thud'); return true;
  }
  if (n && (slot.id === 'hoe' || it.kind === 'seed')) { toast(`Dégage d'abord ${DEBRIS[n.type].name.toLowerCase()} avec la ${DEBRIS[n.type].tool}.`); return true; }
  if (it.kind === 'fert') {
    if (!p) { toast("Pose l'engrais sur une case labourée."); return true; }
    if (p.fert) { toast('Cette case a déjà de l\'engrais.'); return true; }
    p.fert = true; takeFrom(S.sel, 1); refreshPlot(k); anim('seed', 0.25); sfx('plant'); return true;
  }
  if (it.kind === 'place') {
    if (!inFarm(ti, tj) || p || n || placedAt(k) || tiles[k] !== GRASS) { toast("Pose l'arroseur sur une case libre de ton champ."); return true; }
    const pl = { k, type: 'arroseur' }; S.placed.push(pl); spawnPlaced(pl); takeFrom(S.sel, 1); sfx('plant'); xpGain('craft', 3); return true;
  }
  return false;
}

// ---------- Artisanat
const recipeOk = r => lvl('craft') >= r.lvl;
const canCraft = (r, n = 1) => recipeOk(r) && Object.entries(r.need).every(([i2, q]) => countItem(i2) >= q * n);
function craft(rid, n = 1) {
  const r = RECIPES.find(x => x.id === rid); if (!canCraft(r, n)) return;
  if (r.tab === 'cuisine' && !S.inside) { toast('La cuisine se fait chez toi, près du réchaud.'); return; }
  let made = 0;
  for (let q = 0; q < n; q++) {
    if (!(rnd() < tal('recycle') * 0.1)) for (const [i2, c] of Object.entries(r.need)) takeItem(i2, c);
    const out = r.out + (rnd() < tal('serie') * 0.1 ? 1 : 0);
    if (!addItem(r.id, out)) { toast('Ton sac est plein.'); break; }
    made += out; xpGain('craft', 4 + Object.values(r.need).reduce((a, b) => a + b, 0) * 2); bump('crafted', 1);
  }
  if (made) { sfx('harvest'); toast(`Fabriqué : ${made} × ${ITEMS[r.id].name}`); }
}

// ---------- Agrandir la ferme
let stakesG = null;
function rebuildStakes() {
  if (stakesG) scene.remove(stakesG);
  stakesG = new THREE.Group(); scene.add(stakesG);
  const [i0, j0, i1, j1] = fieldRect(), x0 = i0 - 0.05, z0 = j0 - 0.05, x1 = i1 + 1.05, z1 = j1 + 1.05;
  const post = (x, z, k) => { part(stakesG, G.cyl6, '#8a5a3a', [0.04, 0.5, 0.04], [x, 0.25, z]); part(stakesG, G.ico0, RASTA[k % 3], [0.06, 0.06, 0.06], [x, 0.52, z]); };
  const rope = (ax, az, bx, bz) => { const len = Math.hypot(bx - ax, bz - az); const m = part(stakesG, G.box, '#e8c79a', [len, 0.025, 0.025], [(ax + bx) / 2, 0.38, (az + bz) / 2]); m.rotation.y = -Math.atan2(bz - az, bx - ax); m.castShadow = false; };
  let k = 0;
  for (let x = x0; x <= x1 + 0.01; x += Math.max(1, (x1 - x0) / Math.round((x1 - x0) / 2))) { post(x, z0, k++); post(x, z1, k++); }
  for (let z = z0; z <= z1 + 0.01; z += Math.max(1, (z1 - z0) / Math.round((z1 - z0) / 2))) { post(x0, z, k++); post(x1, z, k++); }
  rope(x0, z0, x1, z0); rope(x0, z1, x1, z1); rope(x0, z0, x0, z1); rope(x1, z0, x1, z1);
}
function farmUpgradeOk() {
  const u = FARM_UPG[S.farmLvl + 1]; if (!u) return { ok: false, why: 'Ton yard est déjà au maximum.' };
  if (plvl() < u.pl) return { ok: false, why: `Il faut le niveau ${u.pl}.` };
  if (S.gold < u.gold) return { ok: false, why: `Il te manque ${u.gold - S.gold} g.` };
  for (const [i2, q] of Object.entries(u.need)) if (countItem(i2) < q) return { ok: false, why: `Il te manque ${q - countItem(i2)} ${ITEMS[i2].name.toLowerCase()}.` };
  return { ok: true };
}
function upgradeFarm() {
  if (!farmUpgradeOk().ok) return;
  const u = FARM_UPG[S.farmLvl + 1]; S.gold -= u.gold; for (const [i2, q] of Object.entries(u.need)) takeItem(i2, q);
  S.farmLvl++; rebuildStakes(); sfx('quest'); toast(`Ton champ s'agrandit ! (${fieldSize()} cases cultivables)`, true); bump('farmup');
}
const fieldSize = () => { const r = fieldRect(); return (r[2] - r[0] + 1) * (r[3] - r[1] + 1); };

// ---------- Construire le poulailler et l'étable
const BUILD_G = {};
function makeSite(x0, z0, w, d, label) {
  const g = new THREE.Group(); scene.add(g);
  part(g, G.box, '#b3a79a', [w, 0.18, d], [x0 + w / 2, 0.09, z0 + d / 2]);
  for (const [sx, sz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) part(g, G.cyl6, '#c9a45a', [0.06, 2.2, 0.06], [x0 + 0.2 + sx * (w - 0.4), 1.1, z0 + 0.2 + sz * (d - 0.4)]);
  part(g, G.box, '#c9a45a', [w - 0.2, 0.06, 0.06], [x0 + w / 2, 1.6, z0 + 0.2]); part(g, G.box, '#c9a45a', [w - 0.2, 0.06, 0.06], [x0 + w / 2, 1.6, z0 + d - 0.2]);
  for (let k = 0; k < 4; k++) part(g, G.box, '#b07a48', [1.4, 0.1, 0.25], [x0 + 0.9 + (k % 2) * 0.2, 0.25 + k * 0.1, z0 + d - 0.6], [0, k * 0.2, 0]);
  part(g, G.rock, '#a9a39b', [0.35, 0.3, 0.35], [x0 + w - 0.8, 0.25, z0 + d - 0.6]);
  signBoard(g, label, x0 + w / 2, 1.0, z0 + d + 0.15, 1.9, 0.5);
  return g;
}
function refreshBuildings() { for (const k of ['coop', 'barn']) { if (!BUILD_G[k]) continue; BUILD_G[k].g.visible = S.built[k]; BUILD_G[k].site.visible = !S.built[k]; } }
function buildOk(type) {
  const b = BUILDS[type];
  if (S.built[type]) return { ok: false, why: 'Déjà construit.' };
  if (S.building) return { ok: false, why: 'Un chantier est déjà en cours.' };
  if (S.story.ch < b.ch) return { ok: false, why: 'Débloqué au chapitre 2 de la légende.' };
  if (b.after && !S.built[b.after]) return { ok: false, why: `Construis d'abord le ${BUILDS[b.after].name.toLowerCase()}.` };
  if (plvl() < b.pl) return { ok: false, why: `Il faut le niveau ${b.pl}.` };
  if (S.gold < b.gold) return { ok: false, why: `Il te manque ${b.gold - S.gold} g.` };
  for (const [i2, q] of Object.entries(b.need)) if (countItem(i2) < q) return { ok: false, why: `Il te manque ${q - countItem(i2)} ${ITEMS[i2].name.toLowerCase()}.` };
  return { ok: true };
}
function startBuild(type) {
  if (!buildOk(type).ok) return;
  const b = BUILDS[type]; S.gold -= b.gold; for (const [i2, q] of Object.entries(b.need)) takeItem(i2, q);
  S.building = type; sfx('quest'); toast(`Chantier lancé : ${b.name}. Les potes de Zion bossent cette nuit !`, true);
}

// ---------- Zones verrouillées (portillon, jetée, phare)
const lockState = {};
function lockMesh(key) {
  const g = new THREE.Group(); scene.add(g); const L = LOCKS[key], [x0, z0, x1, z1] = L.box, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0;
  if (key === 'gate') { part(g, G.box, '#7a5136', [w, 0.9, 0.08], [cx, 0.45, cz]); for (let k = 0; k < 6; k++) part(g, G.ico, '#2f8a3c', [0.3, 0.22, 0.2], [x0 + 0.3 + k * 0.5, 0.3 + (k % 3) * 0.2, cz + 0.05]); }
  else if (key === 'pier') { for (const s of [-1, 1]) part(g, G.box, '#6b4a2a', [w + 0.4, 0.12, 0.12], [cx, 0.55, cz], [0, 0, s * 0.35]); part(g, G.box, '#e2362f', [0.9, 0.4, 0.04], [cx, 1.0, cz + 0.08]); }
  else { part(g, G.box, '#8b93a8', [w, 0.12, 0.1], [cx, 0.8, cz]); part(g, G.box, '#8b93a8', [w, 0.12, 0.1], [cx, 0.45, cz]); for (const s of [-1, 1]) part(g, G.box, '#5b6270', [0.12, 1.1, 0.12], [cx + s * w / 2, 0.55, cz]); signBoard(g, 'Ministère', cx, 1.35, cz + 0.1, 1.6, 0.45); }
  return g;
}
function initLocks() { for (const key in LOCKS) { const b = LOCKS[key].box.slice(); lockState[key] = { g: lockMesh(key), box: b }; } refreshLocks(); }
function refreshLocks() {
  let changed = false;
  for (const key in LOCKS) {
    const st = lockState[key], open = S.unlocked[key], has = boxes.includes(st.box);
    st.g.visible = !open;
    if (open && has) { boxes.splice(boxes.indexOf(st.box), 1); changed = true; }
    if (!open && !has) { boxes.push(st.box); changed = true; }
  }
  if (changed && walk) buildWalk();
}
function lockOk(key) {
  const L = LOCKS[key]; if (S.unlocked[key]) return { ok: false, why: 'Déjà ouvert.' };
  if (L.flag) return S.story.flags[L.flag] ? { ok: true } : { ok: false, why: 'Il faut un permis du Ministère des Formulaires.' };
  for (const [i2, q] of Object.entries(L.need)) if (countItem(i2) < q) return { ok: false, why: `Il te manque ${q - countItem(i2)} ${ITEMS[i2].name.toLowerCase()}.` };
  return { ok: true };
}
function unlock(key) {
  if (!lockOk(key).ok) return; const L = LOCKS[key];
  if (L.need) for (const [i2, q] of Object.entries(L.need)) takeItem(i2, q);
  S.unlocked[key] = true; refreshLocks(); sfx('quest'); toast(`${L.name} : ouvert !`, true); xpGain('craft', 20); checkStory();
}
