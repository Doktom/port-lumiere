// =====================================================================
// Mécaniques : inventaire, cultures, pêche, élevage, quêtes, amitiés
// =====================================================================
const plots = new Map();
const keys = {};
let highlight2 = null;

// ---------- Inventaire
function addItem(itemId, n = 1, t = 0, qa = 0) {
  const it = ITEMS[itemId];
  if (it.kind !== 'tool') {
    const st = S.inv.find(s => s && s.id === itemId && (s.qa || 0) === qa);
    if (st) { st.q += n; renderHotbar(); return true; }
  }
  const e = S.inv.indexOf(null); if (e < 0) return false;
  S.inv[e] = it.kind === 'tool' ? { id: itemId, q: 1, t } : qa ? { id: itemId, q: n, qa } : { id: itemId, q: n };
  renderHotbar(); return true;
}
function takeFrom(slot, n = 1) { const s = S.inv[slot]; if (!s) return; s.q -= n; if (s.q <= 0) S.inv[slot] = null; renderHotbar(); }
function takeItem(id, n) { let left = n; for (let k = 0; k < S.inv.length && left > 0; k++) { const s = S.inv[k]; if (s && s.id === id) { const m = Math.min(left, s.q); takeFrom(k, m); left -= m; } } return left === 0; }
function freeSlots() { return S.inv.filter(s => !s).length; }
const farmCost = base => Math.max(0.5, base * (1 - 0.06 * (lvl('farm') - 1)) * (1 - 0.1 * tal('econome')));
function spend(e) { if (S.godEnergy) return true; if (S.energy < e) { toast("Plus assez d'énergie… va t'allonger au hamac."); return false; } S.energy = Math.max(0, S.energy - e); return true; }
function addGold(n, earned) { S.gold += n; if (earned) bump('earned', n); }

// ---------- Compétences
function xpGain(sk, n) {
  const before = lvl(sk), pb = plvl(); S.xp[sk] = (S.xp[sk] || 0) + n; const after = lvl(sk), pa = plvl();
  if (after > before) { toast(`${SKILLS[sk].name} niveau ${after} ! +1 point de talent (carnet)`, true); sfx('level'); S.pending.push(`${SKILLS[sk].name} niveau ${after}`); checkQuests(); }
  if (pa > pb) { toast(`Niveau de joueur ${pa} ! Énergie max : ${maxEn()}`, true); S.energy = Math.min(maxEn(), S.energy + 6); S.pending.push(`Niveau de joueur ${pa}`); }
}

// ---------- Quêtes
function qProgress(q) {
  if (q.deliver) return 0;
  if (q.fn) return q.fn();
  if (q.stat === 'met') return Object.values(S.friends).filter(f => f.met).length;
  return stat(q.stat);
}
const questActive = q => !S.done.includes(q.id) && (!q.req || q.req());
function activeQuests() { return QUESTS.filter(questActive); }
function completeQuest(q) {
  S.done.push(q.id); addGold(q.gold, false);
  let msg = `Quête terminée : ${q.title} (+${q.gold} g)`;
  if (q.item) { if (!addItem(q.item[0], q.item[1])) msg += ' (sac plein, objet perdu)'; else msg += ` · +${q.item[1]} ${ITEMS[q.item[0]].name}`; }
  if (q.friend) { friend(q.deliver[0]).pts += q.friend; }
  toast(msg, true); sfx('quest'); renderTracker(); onQuestDone(q);
}
let questLock = false;
function checkQuests() {
  if (questLock) return; questLock = true;
  for (const q of QUESTS) if (!q.deliver && questActive(q) && qProgress(q) >= q.n) completeQuest(q);
  questLock = false; renderTracker(); checkStory();
}

// ---------- Amitiés
function npcLine(n) {
  const f = friend(n.id), h = hearts(n.id), tier = h < 3 ? 'low' : h < 6 ? 'mid' : 'high';
  if (wet(S.weather) && rnd() < 0.4) return pick(n.rain);
  return pick(n.lines[tier]);
}
function talkNPC(n) {
  const f = friend(n.id); let gain = 0;
  if (!f.met) { f.met = true; toast(`Tu fais la connaissance de ${n.name}.`); checkQuests(); }
  if (f.talked !== S.day) { f.talked = S.day; f.pts += 12; gain = 12; }
  return gain;
}
function tasteOf(n, itemId) { return n.loves.includes(itemId) ? 'love' : n.likes.includes(itemId) ? 'like' : n.hates.includes(itemId) ? 'hate' : 'ok'; }
function giveGift(n, slot) {
  const s = S.inv[slot]; if (!s) return '';
  const f = friend(n.id); if (f.gifted === S.day) return `${n.name} a déjà reçu un cadeau aujourd'hui.`;
  const it = ITEMS[s.id]; if (it.kind === 'tool') return 'On n\'offre pas ses outils.';
  const t = tasteOf(n, s.id), pts = { love: 80, like: 45, ok: 20, hate: -30 }[t];
  f.pts = Math.max(0, f.pts + pts); f.gifted = S.day; takeFrom(slot, 1); bump('gifts');
  sfx(t === 'hate' ? 'lose' : 'coin');
  return { love: `« ${it.name} ?! Mon préféré ! Merci, merci ! » (+80)`, like: `« Oh, j'aime beaucoup, merci ! » (+45)`, ok: `« Gentil, merci pour la pensée. » (+20)`, hate: `« Euh... merci ? Je vais... le ranger. » (-30)` }[t];
}
const shopBonus = key => hearts(SHOPS[key].npc) >= 5;
const priceBuy = (key, base) => Math.round(base * (shopBonus(key) ? 0.9 : 1));
const priceSell = (key, id, qa) => Math.round(sellOf(id, qa) * (shopBonus(key) ? 1.1 : 1));

// ---------- Cultures
const soilDry = toon('#a9543a'), soilWet = toon('#6b3226');
const cropG = { leaf: new THREE.SphereGeometry(1, 8, 6), ball: new THREE.SphereGeometry(1, 10, 8) };
function leafAt(g, y, ang, len, wid, tilt, col) {
  const pv = new THREE.Group(); pv.rotation.y = ang; pv.position.y = y; g.add(pv);
  const m = part(pv, cropG.leaf, col, [wid, 0.022, len], [0, 0.04 + Math.sin(tilt) * len * 0.55, Math.cos(tilt) * len * 0.75], [-tilt, 0, 0]); m.castShadow = false;
}
function palmLeaf(g, y, out, size, col) { for (const a of [-1, -0.5, 0, 0.5, 1]) leafAt(g, y, out + a * 0.55, size * (1 - Math.abs(a) * 0.35), 0.03, 0.3, col); }
function cropStage(c) { const d = CROPS[c.type].days; if (c.age >= d) return 3; if (c.age === 0) return 0; return c.age / d < 0.5 ? 1 : 2; }
function buildCrop(type, st) {
  const g = new THREE.Group(), L1 = '#9be06a', L2 = '#3fae4a', L3 = '#2f9a40';
  if (st === 0) { for (let k = 0; k < 3; k++) part(g, cropG.ball, '#4a3020', [0.035, 0.03, 0.035], [Math.cos(k * 2.1) * 0.13, 0.02, Math.sin(k * 2.1) * 0.13]); return g; }
  if (st === 1) {
    if (type === 'ganja') { leafAt(g, 0, 0, 0.1, 0.07, 0.5, L1); leafAt(g, 0, Math.PI, 0.1, 0.07, 0.5, L1); }
    else { leafAt(g, 0, 0, 0.13, 0.055, 0.8, L1); leafAt(g, 0, Math.PI, 0.13, 0.055, 0.8, L1); }
    return g;
  }
  const ripe = st === 3;
  if (type === 'gombo') {
    part(g, G.cyl6, '#6fbe3f', [0.02, ripe ? 0.5 : 0.3, 0.02], [0, ripe ? 0.25 : 0.15, 0]);
    for (let k = 0; k < 4; k++) leafAt(g, ripe ? 0.25 + k * 0.06 : 0.12, k * 1.6, 0.2, 0.09, 0.5, ripe ? L3 : L2);
    if (ripe) for (let k = 0; k < 4; k++) part(g, G.cone, '#6fbe3f', [0.025, 0.14, 0.025], [Math.cos(k * 1.6) * 0.09, 0.3 + (k % 2) * 0.1, Math.sin(k * 1.6) * 0.09], [Math.sin(k) * 0.3, 0, 0.3]);
  } else if (type === 'patate') {
    for (let k = 0; k < (ripe ? 6 : 5); k++) leafAt(g, 0.02, k * 1.1, ripe ? 0.26 : 0.2, 0.1, 0.25, ripe ? '#3a8f3a' : L2);
    if (ripe) part(g, cropG.ball, '#a24b8a', [0.14, 0.08, 0.1], [0.04, 0.03, 0.02], [0, 0.4, 0]);
  } else if (type === 'tomate') {
    part(g, G.cyl6, '#a0764a', [0.025, 0.8, 0.025], [0.12, 0.4, -0.05]);
    part(g, cropG.ball, L2, [0.18, 0.16, 0.18], [0, 0.2, 0]); part(g, cropG.ball, ripe ? L3 : L2, [0.16, 0.15, 0.16], [0.02, 0.42, 0.02]);
    if (ripe) { part(g, cropG.ball, L3, [0.14, 0.13, 0.14], [-0.05, 0.6, 0]); for (const [x, y, z] of [[0.15, 0.25, 0.08], [-0.13, 0.36, 0.1], [0.1, 0.5, 0.12], [-0.08, 0.58, 0.1]]) part(g, cropG.ball, '#e8402e', [0.065, 0.065, 0.065], [x, y, z]); }
  } else if (type === 'piment') {
    part(g, cropG.ball, ripe ? L3 : L2, [0.2, 0.2, 0.2], [0, 0.2, 0]);
    if (ripe) for (const [x, y, z, c] of [[0.14, 0.18, 0.1, '#e2362f'], [-0.12, 0.26, 0.1, '#f08a2a'], [0.05, 0.36, -0.1, '#e2362f'], [-0.1, 0.14, -0.12, '#f6c026']]) part(g, G.cone, c, [0.04, 0.12, 0.04], [x, y, z], [Math.PI, 0, 0.3]);
  } else if (type === 'giraumon') {
    for (let k = 0; k < 4; k++) leafAt(g, 0.02, k * 1.57 + 0.4, 0.26, 0.15, 0.25, L2);
    if (!ripe) part(g, cropG.ball, '#8cc152', [0.1, 0.08, 0.1], [0.05, 0.08, 0.05]);
    else { part(g, cropG.ball, toon('#e89a2a', { flatShading: true }), [0.3, 0.22, 0.3], [0, 0.2, 0]); part(g, G.cyl6, '#7a5136', [0.03, 0.12, 0.03], [0, 0.45, 0]); }
  } else if (type === 'ananas') {
    for (let k = 0; k < 8; k++) part(g, G.cone, ripe ? L3 : L2, [0.04, 0.3, 0.02], [Math.cos(k * 0.785) * 0.1, 0.14, Math.sin(k * 0.785) * 0.1], [Math.sin(k * 0.785) * 0.6, k * 0.785, -Math.cos(k * 0.785) * 0.6]);
    if (ripe) { part(g, cropG.ball, '#f6c026', [0.13, 0.17, 0.13], [0, 0.2, 0]); for (let k = 0; k < 5; k++) part(g, G.cone, '#2f9a40', [0.03, 0.14, 0.015], [Math.cos(k * 1.26) * 0.04, 0.42, Math.sin(k * 1.26) * 0.04], [Math.sin(k * 1.26) * 0.5, 0, -Math.cos(k * 1.26) * 0.5]); }
  } else if (type === 'ganja') {
    const h = ripe ? 0.55 : 0.3;
    part(g, G.cyl6, '#5a8f3a', [0.02, h, 0.02], [0, h / 2, 0]);
    const nodes = ripe ? [0.12, 0.26, 0.4] : [0.1, 0.22];
    nodes.forEach((y, k) => { palmLeaf(g, y, k * 1.0, ripe ? 0.2 : 0.14, ripe ? L3 : L2); palmLeaf(g, y, k * 1.0 + Math.PI, ripe ? 0.2 : 0.14, ripe ? L3 : L2); });
    if (ripe) { for (const [x, y, z] of [[0, 0.58, 0], [0.04, 0.5, 0.03], [-0.04, 0.46, -0.03]]) { part(g, cropG.ball, '#9be06a', [0.05, 0.07, 0.05], [x, y, z]); part(g, G.cone, '#f08a2a', [0.008, 0.04, 0.008], [x, y + 0.06, z]); } }
  }
  return g;
}
function refreshPlot(k) {
  const p = plots.get(k); const i = k % W, j = (k / W) | 0;
  if (!p.soil) { p.soil = new THREE.Mesh(G.box, soilDry); p.soil.scale.set(0.94, 0.07, 0.94); p.soil.position.set(i + 0.5, 0.035, j + 0.5); p.soil.receiveShadow = true; scene.add(p.soil); }
  p.soil.material = p.watered ? soilWet : soilDry;
  if (p.cropMesh) { scene.remove(p.cropMesh); p.cropMesh = null; }
  if (p.crop) { p.cropMesh = buildCrop(p.crop.type, cropStage(p.crop)); p.cropMesh.position.set(i + 0.5, 0.07, j + 0.5); p.cropMesh.rotation.y = hash2(i, j) * 6.28; scene.add(p.cropMesh); }
}
function till(k, fromSave) {
  plots.set(k, { watered: wet(S.weather), crop: null, soil: null, cropMesh: null });
  const dec = tileDecor.get(k); if (dec) { for (const [b, n] of dec) b.hide(n); tileDecor.delete(k); if (!fromSave && rnd() < 0.5) addItem('fibre', 1); }
  refreshPlot(k);
}
function clearPlots() { for (const p of plots.values()) { if (p.soil) scene.remove(p.soil); if (p.cropMesh) scene.remove(p.cropMesh); } plots.clear(); }
function canTill(i, j) {
  if (!inFarm(i, j) || tiles[id(i, j)] !== GRASS || plots.has(id(i, j)) || nodeAt(id(i, j)) || placedAt(id(i, j))) return false;
  for (const b of boxes) if (b[0] < i + 0.9 && b[2] > i + 0.1 && b[1] < j + 0.9 && b[3] > j + 0.1) return false;
  return true;
}
function harvest(k) {
  const p = plots.get(k), def = CROPS[p.crop.type];
  const qa = rollQuality(p.fert ? 0.15 : 0);
  if (!addItem(def.item, 1, 0, qa)) { toast('Ton sac est plein.'); return; }
  let bonus = qa ? ` (${QUAL[qa].name})` : '';
  if (lvl('farm') >= 5 && rnd() < 0.18) { addItem(def.item, 1, 0, qa); bonus += ' ×2'; }
  if (def.regrow) p.crop.age = def.days - def.regrow; else { p.crop = null; p.fert = false; }
  refreshPlot(k); sfx('harvest'); floater(`+1 ${ITEMS[def.item].name}${bonus}`, def.item);
  xpGain('farm', 3 + Math.round(ITEMS[def.item].sell / 12)); bump('harvested');
}

// ---------- Actions du joueur
function busy() { return !!(S.modal || S.title || S.fade); }
function targetKey() { const [i, j] = S.target; return inMap(i, j) ? id(i, j) : -1; }
function faceTarget() {
  const [i, j] = S.target, dx = i + 0.5 - P.x, dz = j + 0.5 - P.z;
  if (Math.abs(dx) < 0.3 && Math.abs(dz) < 0.3) return;
  P.face = Math.atan2(dx, dz);
  S.card = Math.abs(dx) > Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)];
}
function anim(type, dur = 0.3) { S.swing = dur; S.swingDur = dur; S.swingType = type; }
function lineTiles(ti, tj, n) { const out = []; for (let q = 0; q < n; q++) out.push([ti + S.card[0] * q, tj + S.card[1] * q]); return out; }
function useItem() {
  if (S.swing > 0 || busy() || S.fish.phase) return;
  const k = targetKey(); if (k < 0) return;
  const [ti, tj] = S.target, p = plots.get(k);
  if (p && p.crop && cropStage(p.crop) === 3) { faceTarget(); harvest(k); anim('pick', 0.25); return; }
  const slot = S.inv[S.sel]; if (!slot) return;
  const it = ITEMS[slot.id], tier = slot.t || 0;
  faceTarget();
  if (useExtra(slot, it, tier, ti, tj, k, p)) return;
  if (slot.id === 'hoe') {
    if (!spend(farmCost(2))) return;
    anim('hoe', 0.34); let n = 0;
    for (const [i, j] of lineTiles(ti, tj, tierLine(tier))) if (canTill(i, j)) { till(id(i, j)); n++; }
    if (n) { sfx('hoe'); bump('tilled', n); xpGain('farm', n); }
    else { sfx('thud'); if (inField(ti, tj) && !inFarm(ti, tj) && tiles[k] === GRASS) toast('Zone en friche : agrandis ton champ (panneau « Agrandir » près de la case).'); else if (!inField(ti, tj) && tiles[k] === GRASS) toast('Tu ne peux labourer que dans le champ de ton yard.'); }
  } else if (slot.id === 'can') {
    if (waterAt(ti, tj)) { S.water = canMax(tier); anim('can', 0.35); sfx('splash'); toast('Arrosoir rempli.'); renderHotbar(); return; }
    const tl = lineTiles(ti, tj, tierLine(tier)).filter(([i, j]) => inMap(i, j) && plots.has(id(i, j)) && !plots.get(id(i, j)).watered);
    if (!plots.has(k)) return;
    if (S.water <= 0) { toast("Arrosoir vide : remplis-le à la rivière ou à la mer."); return; }
    if (!tl.length) return;
    if (!spend(farmCost(1))) return;
    anim('can', 0.35);
    for (const [i, j] of tl) { if (S.water <= 0) break; const pk = id(i, j); plots.get(pk).watered = true; S.water--; refreshPlot(pk); bump('watered'); }
    sfx('water'); renderHotbar();
  } else if (it.kind === 'seed') {
    if (!p) { toast('Laboure la terre avant de semer.'); return; }
    if (p.crop) return;
    const def = CROPS[it.crop];
    if (!def.seasons.includes(seasonOf(S.day))) { toast(`${ITEMS[def.item].name} : hors saison. Pousse en ${def.seasons.map(s => SEASONS[s]).join(' et ')}.`); return; }
    if (lvl('farm') < def.lvl) { toast(`Il faut le niveau ${def.lvl} en agriculture.`); return; }
    p.crop = { type: it.crop, age: 0 }; if (wet(S.weather)) p.watered = true; takeFrom(S.sel, 1); refreshPlot(k); anim('seed', 0.25); sfx('plant'); bump('planted');
  } else if (slot.id === 'rod') startCast();
}
function eat() {
  if (busy() || S.fish.phase) return;
  const s = S.inv[S.sel]; if (!s || !ITEMS[s.id].food) { toast('Sélectionne un aliment pour le manger.'); return; }
  if (S.energy >= maxEn()) { toast("Tu n'as pas faim."); return; }
  const f = ITEMS[s.id].food; S.energy = Math.min(maxEn(), S.energy + f); takeFrom(S.sel, 1); sfx('eat'); floater(`+${f} énergie`);
}

// ---------- Interactions (E)
const interactables = [
  { x: 8.1, z: 6.6, r: 1.8, label: 'Dormir au hamac', ok: () => S.inside, act: () => openSleep() },
  { x: 13.7, z: 13.2, r: 1.5, label: "Coffre d'expédition", act: () => openBin() },
  { x: 60, z: 16.1, r: 1.7, label: 'Graines Irie', act: () => openShop('graines') },
  { x: 71, z: 45.1, r: 1.7, label: 'Poissonnerie du Port', act: () => openShop('poisson') },
  { x: 79, z: 19.9, r: 1.7, label: 'Dread & Style', act: () => openShop('boutique') },
  { x: 80, z: 37.0, r: 1.8, label: 'Chez Zion', act: () => openShop('cafe') },
  { x: 20, z: 8.9, r: 1.8, label: 'Poulailler', act: () => S.built.coop ? openAnimals('poule') : openBuild('coop') },
  { x: 28.75, z: 9.6, r: 2.0, label: 'Étable', act: () => S.built.barn ? openAnimals('vache') : openBuild('barn') },
  { x: 15.6, z: 13.4, r: 1.4, label: 'Agrandir le yard', act: () => openFarmUp() },
  { x: 19.5, z: 44.6, r: 1.6, label: 'Portillon de la plage', ok: () => !S.unlocked.gate, act: () => openLock('gate') },
  { x: 63.5, z: 51.2, r: 1.6, label: 'Bout de la jetée', ok: () => !S.unlocked.pier, act: () => openLock('pier') },
  { x: 88.5, z: 49.7, r: 1.5, label: 'Porte du phare', ok: () => !S.unlocked.lighthouse, act: () => openLock('lighthouse') },
  { x: 88.5, z: 49.7, r: 1.5, label: 'Monter en haut du phare', ok: () => S.unlocked.lighthouse, act: () => climbLighthouse() },
  { x: 63.5, z: 24.5, r: 2.8, label: "Poser le Vinyle d'Or", ok: () => S.story.frags.length >= 7 && !S.story.flags.awake, act: () => finale() },
];
function nearestInteract() {
  let best = null, bd = 99;
  const take = (d, o) => { if (d < bd) { bd = d; best = o; } };
  for (const it of interactables) { if (it.ok && !it.ok()) continue; const d = Math.hypot(P.x - it.x, P.z - it.z); if (d < it.r) take(d - 0.3, it); }
  for (const n of npcs) {
    if (n.hidden) continue; const d = Math.hypot(P.x - n.x, P.z - n.z);
    const atCounter = n.shop && n.cur === `${n.id}_counter` && !n.path && S.time >= SHOPS[n.shop].open && S.time < SHOPS[n.shop].close;
    if (d < 1.5 && !atCounter) take(d, { label: `Parler à ${n.name}`, act: () => openNPC(n) });
  }
  for (const o of animalMeshes.values()) { if (!o.g.visible) continue; const d = Math.hypot(P.x - o.x, P.z - o.z); if (d < 1.25) take(d - 0.2, { label: `Caresser ${o.a.name}`, act: () => petAnimal(o.a) }); }
  for (const f of forage) { if (!f.has) continue; const d = Math.hypot(P.x - f.x, P.z - f.z); if (d < 1.5) take(d, { label: 'Secouer le cocotier', act: () => shakePalm(f) }); }
  return best;
}
function interact() {
  if (busy() || S.fish.phase) return;
  const k = targetKey(), p = plots.get(k);
  if (p && p.crop && cropStage(p.crop) === 3) { faceTarget(); harvest(k); anim('pick', 0.25); return; }
  const it = nearestInteract(); if (it) it.act();
}
function shakePalm(f) {
  if (!f.has) return; anim('pick', 0.4);
  let n = 1 + (lvl('forage') >= 3 ? 1 : 0);
  if (!addItem('coco', n)) { toast('Ton sac est plein.'); return; }
  f.has = false; f.g.visible = false; S.picked.coco.push(f.idx); sfx('harvest'); floater(`+${n} noix de coco`, 'coco'); xpGain('forage', 6); bump('forage', n);
}
function pickShells() {
  shellSpots.forEach((sp, k) => {
    if (!sp.on || Math.hypot(P.x - sp[0], P.z - sp[1]) > 0.8) return;
    const n = lvl('forage') >= 2 && rnd() < 0.3 ? 2 : 1;
    if (!addItem('coquillage', n)) return;
    sp.on = false; shellB.hide(k); S.picked.shells.push(k); sfx('coin'); floater(`+${n} coquillage`, 'coquillage'); xpGain('forage', 4); bump('shells', n);
  });
}

// ---------- Élevage
const CAPACITY = { poule: 6, vache: 3 }, ANIMAL_PRICE = { poule: 250, vache: 900 };
let animalSeq = 1;
function animalsOf(type) { return S.animals.filter(a => a.type === type); }
function buyAnimal(type) {
  if (animalsOf(type).length >= CAPACITY[type]) return;
  if (S.gold < ANIMAL_PRICE[type]) return;
  const used = S.animals.map(a => a.name), name = NAMES_ANIMALS.find(n => !used.includes(n)) || pick(NAMES_ANIMALS);
  S.gold -= ANIMAL_PRICE[type]; S.animals.push({ id: 'a' + (animalSeq++) + '_' + S.day, type, name, col: (rnd() * 5) | 0, happy: 50, fed: false, pet: false });
  bump(type === 'poule' ? 'chickens' : 'cows'); syncAnimalMeshes(); sfx('coin');
}
function feedAll(type) {
  const list = animalsOf(type).filter(a => !a.fed);
  if (!list.length) { toast('Tout le monde a déjà mangé.'); return; }
  const have = countItem('fourrage'), n = Math.min(have, list.length);
  if (!n) { toast('Il te faut du fourrage (Graines Irie).'); return; }
  let used = 0; for (let k = 0; k < n; k++) { list[k].fed = true; list[k].happy = Math.min(100, list[k].happy + 4); if (!(rnd() < tal('gamelle') * 0.2)) used++; }
  takeItem('fourrage', used);
  sfx('eat'); toast(`${n} animal${n > 1 ? 'aux nourris' : ' nourri'}.`.replace('animalaux', 'animaux'));
  xpGain('ranch', 2 * n);
}
function petAnimal(a) {
  if (a.pet) { toast(`${a.name} a déjà eu sa caresse du jour.`); return; }
  a.pet = true; a.happy = Math.min(100, a.happy + 8 + lvl('ranch') + 3 * tal('calin')); sfx(a.type === 'poule' ? 'cluck' : 'moo'); floater(`${a.name} est content !`); xpGain('ranch', 2); anim('pick', 0.3);
}
function collectShed(type) {
  const keys2 = type === 'poule' ? ['oeuf', 'oeuf_or'] : ['lait', 'lait_creme'];
  let got = 0;
  for (const k of keys2) { while (S.shed[k] > 0 && addItem(k, 1)) { S.shed[k]--; got++; bump(type === 'poule' ? 'eggs' : 'milk'); if (k === 'oeuf_or') bump('golden_eggs'); xpGain('ranch', 4); } }
  if (got) { sfx('harvest'); toast(`Tu récupères ${got} produit${got > 1 ? 's' : ''}.`); } else toast(S.shed[keys2[0]] + S.shed[keys2[1]] ? 'Ton sac est plein.' : 'Rien à ramasser pour le moment.');
}

// ---------- Pêche
const fishUI = $('#fishing'), fishC = $('#fish-c'), fctx = fishC.getContext('2d');
let fishImg = new Image(), mg = null, bang = null;
function startCast() {
  const [dx, dz] = S.card, pi = Math.floor(P.x), pj = Math.floor(P.z);
  let tgt = null;
  for (const d of [3, 4, 2, 1]) { const i = pi + dx * d, j = pj + dz * d; if (waterAt(i, j) && inMap(i, j)) { tgt = [i, j]; break; } }
  if (!tgt) { toast("Vise l'eau pour lancer ta ligne."); return; }
  if (!spend(3)) return;
  const bait = countItem('appat') > 0; if (bait) takeItem('appat', 1);
  const k = id(tgt[0], tgt[1]);
  S.fish = { phase: 'cast', t: 0, to: new THREE.Vector3(tgt[0] + 0.5, -0.24, tgt[1] + 0.5), from: new THREE.Vector3(), type: tiles[k] === RIVER ? 'river' : 'sea', pier: tgt[1] >= 55, bait };
  tools.rodTip(S.fish.from); bobber.visible = true; fishLine.visible = true; anim('cast', 0.45); sfx('cast');
}
function endFishing(msg) {
  S.fish = { phase: null }; bobber.visible = false; fishLine.visible = false; fishUI.hidden = true; bang.hidden = true; mg = null;
  if (msg) toast(msg);
}
function pickFish(f) {
  const night = isNight(), rareBoost = (lvl('fish') >= 5 ? 0.4 : 0) + (toolTier('rod') >= 2 ? 0.4 : 0) + 1 + 0.2 * tal('flair') + (f.bait ? 0.5 : 0);
  const list = FISH_TABLE[f.type].filter(e => !e[2] || (e[2] === 'night' && night) || (e[2] === 'pier' && f.pier));
  const w = e => e[1] * (e[1] < 20 ? rareBoost * (f.pier ? 1.6 : 1) : 1);
  let tot = 0; for (const e of list) tot += w(e);
  let r = rnd() * tot;
  for (const e of list) { r -= w(e); if (r <= 0) return e[0]; }
  return list[0][0];
}
function startMinigame() {
  const fid = pickFish(S.fish), def = ITEMS[fid];
  S.fish.phase = 'game'; bang.hidden = true;
  const TR = 300, barH = 70 + 7 * (lvl('fish') - 1) + [0, 22, 40][toolTier('rod')] + 10 * tal('ligne');
  mg = { fid, d: def.diff, TR, barH, barY: TR - barH, barV: 0, fy: TR * 0.7, ft: TR * 0.5, ftT: 0, prog: 0.3 + (lvl('fish') >= 3 ? 0.08 : 0) };
  fishImg = new Image(); fishImg.src = icon(fid);
  fishUI.hidden = false; sfx('bite');
}
function updateMinigame(dt) {
  const m = mg; if (!m) return;
  m.barV += (S.hold ? -1250 : 820) * dt; m.barV = clamp(m.barV, -520, 620);
  m.barY += m.barV * dt;
  if (m.barY < 0) { m.barY = 0; m.barV *= -0.25; }
  if (m.barY > m.TR - m.barH) { m.barY = m.TR - m.barH; m.barV *= -0.3; }
  m.ftT -= dt;
  if (m.ftT <= 0) { m.ftT = lerp(1.7, 0.32, m.d / 100) * (0.6 + rnd() * 0.8); m.ft = clamp(m.fy + (rnd() - 0.5) * m.TR * lerp(0.5, 1.2, m.d / 100), 10, m.TR - 10); }
  m.fy += (m.ft - m.fy) * Math.min(1, dt * (1.4 + m.d / 20)) + Math.sin(performance.now() / 90) * m.d / 160;
  m.fy = clamp(m.fy, 8, m.TR - 8);
  const inside = m.fy > m.barY && m.fy < m.barY + m.barH;
  m.prog += (inside ? 0.27 : -0.2 * (0.6 + m.d / 110)) * dt;
  if (m.prog >= 1) {
    const def = ITEMS[m.fid], cm = Math.round(lerp(def.cm[0], def.cm[1], rnd()));
    const fq = rnd() < 0.04 * lvl('fish') ? (rnd() < 0.3 ? 2 : 1) : 0;
    if (addItem(m.fid, 1, 0, fq)) {
      sfx('catch'); floater(`${def.name} · ${cm} cm`, m.fid); toast(`Tu as pêché : ${def.name} (${cm} cm) !`);
      const L = S.fishLog[m.fid] || (S.fishLog[m.fid] = { n: 0, max: 0 }); L.n++; L.max = Math.max(L.max, cm);
      xpGain('fish', 5 + Math.round(def.diff / 2)); bump('caught');
    } else toast("Ton sac est plein, le poisson retourne à l'eau.");
    endFishing(); return;
  }
  if (m.prog <= 0) { sfx('lose'); endFishing("Il s'est échappé…"); return; }
  const dpr = PR, cw = fishC.clientWidth, ch = fishC.clientHeight;
  if (fishC.width !== Math.round(cw * dpr)) { fishC.width = Math.round(cw * dpr); fishC.height = Math.round(ch * dpr); }
  const sc = (ch - 20) / m.TR;
  const x = fctx; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, cw, ch);
  const tw = cw * 0.52, tx = 6, ty = 10, th = m.TR * sc;
  x.lineWidth = 2.5; x.strokeStyle = '#241a2e';
  x.fillStyle = '#35bfd8'; x.beginPath(); x.roundRect(tx, ty, tw, th, 10); x.fill();
  x.fillStyle = '#1f8fc0'; x.beginPath(); x.roundRect(tx, ty + th * 0.72, tw, th * 0.28, [0, 0, 10, 10]); x.fill();
  x.beginPath(); x.roundRect(tx, ty, tw, th, 10); x.stroke();
  x.fillStyle = inside ? 'rgba(111,230,95,.9)' : 'rgba(111,230,95,.55)';
  x.beginPath(); x.roundRect(tx + 3, ty + m.barY * sc, tw - 6, m.barH * sc, 7); x.fill(); x.stroke();
  const fs = tw * 0.95; if (fishImg.complete && fishImg.naturalWidth) x.drawImage(fishImg, tx + tw / 2 - fs / 2, ty + m.fy * sc - fs / 2, fs, fs);
  const px = tx + tw + 8, pw = cw - px - 6;
  x.fillStyle = '#241a2e'; x.beginPath(); x.roundRect(px, ty, pw, th, 6); x.fill();
  x.fillStyle = m.prog < 0.3 ? '#e2362f' : m.prog < 0.7 ? '#f6c026' : '#2fa84f';
  const ph = (th - 6) * clamp(m.prog, 0, 1); x.beginPath(); x.roundRect(px + 3, ty + th - 3 - ph, pw - 6, ph, 4); x.fill();
}
function updateFishing(dt) {
  const f = S.fish; if (!f.phase) return;
  const tp = performance.now() / 1000;
  if (f.phase === 'cast') {
    f.t += dt; const u = Math.min(1, f.t / 0.45);
    bobber.position.lerpVectors(f.from, f.to, u); bobber.position.y += Math.sin(u * Math.PI) * 1.6;
    if (u >= 1) { f.phase = 'wait'; f.wait = (1.5 + rnd() * 5) * (wet(S.weather) ? 0.7 : 1) * (lvl('fish') >= 3 ? 0.8 : 1) * [1, 0.85, 0.7][toolTier('rod')] * (1 - 0.12 * tal('patience')) * (f.bait ? 0.6 : 1); sfx('splash'); }
  } else if (f.phase === 'wait') {
    bobber.position.copy(f.to); bobber.position.y += Math.sin(tp * 3) * 0.02;
    f.wait -= dt; if (f.wait <= 0) { f.phase = 'bite'; f.bite = 0.95; bang.hidden = false; sfx('bite'); }
  } else if (f.phase === 'bite') {
    bobber.position.copy(f.to); bobber.position.y += -0.08 + Math.sin(tp * 30) * 0.03;
    f.bite -= dt; if (f.bite <= 0) { sfx('lose'); endFishing('Trop tard, il a filé.'); }
  } else if (f.phase === 'game') {
    bobber.position.copy(f.to); bobber.position.x += Math.sin(tp * 7) * 0.12; bobber.position.y -= 0.06;
    updateMinigame(dt);
  }
  if (S.fish.phase) {
    const a = new THREE.Vector3(); tools.rodTip(a); const b = bobber.position; const arr = fishLine.geometry.attributes.position;
    for (let k = 0; k <= 12; k++) { const u = k / 12; arr.setXYZ(k, lerp(a.x, b.x, u), lerp(a.y, b.y + 0.06, u) - Math.sin(u * Math.PI) * 0.35, lerp(a.z, b.z, u)); }
    arr.needsUpdate = true;
  }
}

// ---------- Nuit, sommeil, sauvegarde
function serialize(full) {
  const d = { v: 3, day: S.day, gold: S.gold, energy: S.energy, inv: S.inv, water: S.water, ship: S.ship,
    plots: [...plots.entries()].map(([k, p]) => [k, p.watered ? 1 : 0, p.crop ? p.crop.type : 0, p.crop ? p.crop.age : 0, p.fert ? 1 : 0]),
    xp: S.xp, friends: S.friends, stats: S.stats, done: S.done, animals: S.animals, shed: S.shed, owned: S.owned, eq: S.eq, fishLog: S.fishLog, picked: S.picked, seq: animalSeq,
    farmLvl: S.farmLvl, built: S.built, building: S.building, unlocked: S.unlocked, nodes: S.nodes, placed: S.placed, talents: S.talents, story: S.story };
  if (full) Object.assign(d, { time: S.time, x: P.x, z: P.z, sel: S.sel });
  return d;
}
function applySave(d) {
  resetState(); S.title = false;
  const keep = ['day', 'gold', 'energy', 'water', 'ship', 'friends', 'stats', 'done', 'animals', 'shed', 'owned', 'eq', 'fishLog', 'picked', 'farmLvl', 'building', 'nodes', 'placed', 'talents'];
  for (const k of keep) if (d[k] !== undefined) S[k] = d[k];
  for (const k of ['xp', 'built', 'unlocked']) if (d[k]) S[k] = { ...S[k], ...d[k] };
  if (d.story) S.story = { ...S.story, ...d.story, flags: { ...d.story.flags } };
  S.inv = Array.isArray(d.inv) && d.inv.length === INV_SIZE ? d.inv : defaultInv();
  S.time = d.time ?? 360; S.sel = d.sel ?? 0; S.warned = S.time >= 1440; S.weather = weatherFor(S.day); animalSeq = d.seq || 1;
  P.x = d.x ?? 11; P.z = d.z ?? 13.4;
  clearPlots();
  for (const [k, w, type, age, fe] of d.plots || []) {
    till(k, true); const p = plots.get(k); p.watered = !!w; p.fert = !!fe; if (type && CROPS[type]) p.crop = { type, age }; refreshPlot(k);
  }
  S.water = Math.min(S.water, canMax(toolTier('can')));
  for (const id2 of ['machette', 'pioche']) if (!hasItem(id2)) addItem(id2, 1);
  buildPlayer(); syncAnimalMeshes(); refreshForage(); placeAllNPCs(); rebuildNodes(); rebuildPlaced(); refreshBuildings(); refreshLocks(); rebuildStakes(); renderHotbar(); renderTracker();
}
function save() { writeSlot(S.slot, { ...serialize(false), savedAt: Date.now() }); }
function loadSave() { const n = lastSlot(); return n ? readSlot(n) : null; }

async function sleepNow(passedOut) {
  if (S.fade) return;
  closeModal(); endFishing();
  S.fade = true; $('#fade').classList.add('on'); await wait(750);
  const res = { grown: 0, earned: 0, dead: 0, eggs: 0, milk: 0, lost: 0, passedOut, ups: S.pending.splice(0), season: null, shipped: S.ship.slice() };
  for (const [k, p] of plots) {
    if (p.crop && p.watered && p.crop.age < CROPS[p.crop.type].days) {
      p.crop.age++; res.grown++;
      if ((p.fert && rnd() < 0.25) || rnd() < tal('pousse') * 0.06) p.crop.age = Math.min(CROPS[p.crop.type].days, p.crop.age + 1);
    }
    p.watered = false;
  }
  for (const a of S.animals) {
    if (a.fed) {
      const prem = (a.happy >= 80 ? 0.3 : 0.06) + (lvl('ranch') >= 3 ? 0.1 : 0) + 0.06 * tal('premium');
      if (a.type === 'poule') { S.shed[rnd() < prem ? 'oeuf_or' : 'oeuf']++; res.eggs++; } else { S.shed[rnd() < prem ? 'lait_creme' : 'lait']++; res.milk++; }
    } else a.happy = Math.max(0, a.happy - 12);
    if (a.fed && !a.pet) a.happy = Math.max(0, a.happy - 2);
    a.fed = false; a.pet = false;
  }
  for (const [it, q, qa] of S.ship) res.earned += sellOf(it, qa) * q; S.ship = []; addGold(res.earned, true);
  if (passedOut) { res.lost = Math.min(500, Math.floor(S.gold * 0.1)); S.gold -= res.lost; }
  const oldSeason = seasonOf(S.day); S.day++; const ns = seasonOf(S.day);
  if (ns !== oldSeason) {
    res.season = ns;
    for (const [k, p] of plots) if (p.crop && !CROPS[p.crop.type].seasons.includes(ns)) { p.crop = null; res.dead++; }
  }
  S.weather = weatherFor(S.day);
  if (wet(S.weather)) for (const p of plots.values()) p.watered = true;
  runSprinklers();
  if (S.building) { S.built[S.building] = true; res.built = S.building; S.building = null; refreshBuildings(); }
  dailyNodes();
  S.time = 360; S.warned = false; S.energy = passedOut ? Math.round(maxEn() * 0.6) : maxEn(); S.picked = { coco: [], shells: [] };
  P.x = 9.7; P.z = 7.2; P.face = Math.PI / 2; S.card = [1, 0];
  for (const k of plots.keys()) refreshPlot(k);
  refreshForage(); placeAllNPCs(); checkQuests(); save();
  S.fade = false; $('#fade').classList.remove('on');
  openDayCard(res);
}
