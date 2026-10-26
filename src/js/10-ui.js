// =====================================================================
// Interface
// =====================================================================
const hotbarEl = $('#hotbar');
function slotHTML(s, k, extra = '') {
  const lab = s ? itemName(s) : 'Vide';
  let inner = s ? `<img src="${icon(s.id, s.t || 0)}" alt="">` : '';
  if (s && ITEMS[s.id].kind !== 'tool' && s.q > 1) inner += `<span class="q">${s.q}</span>`;
  if (s && s.id === 'can' && k < 10) inner += `<span class="gauge"><i style="width:${S.water / canMax(s.t || 0) * 100}%"></i></span>`;
  return { lab, inner };
}
function renderHotbar() {
  hotbarEl.innerHTML = S.inv.slice(0, 10).map((s, k) => {
    const { lab, inner } = slotHTML(s, k);
    return `<button class="slot${k === S.sel ? ' sel' : ''}" data-slot="${k}" aria-label="${lab}" title="${lab}"><span class="k">${(k + 1) % 10}</span>${inner}</button>`;
  }).join('');
  if (S.modal === 'bag') renderModal();
}
hotbarEl.addEventListener('click', e => { const b = e.target.closest('[data-slot]'); if (b) { select(+b.dataset.slot); canvas.focus(); } });
let nameT = 0;
function select(k) {
  if (S.fish.phase) return;
  S.sel = (k + 10) % 10; renderHotbar(); sfx('sel');
  const s = S.inv[S.sel]; const el = $('#itemname'); el.textContent = s ? itemName(s) : ''; el.style.opacity = s ? 1 : 0; nameT = 1.6;
}
function toast(msg, good) {
  const el = document.createElement('div'); el.className = 'toast panel' + (good ? ' good' : ''); el.textContent = msg; $('#toasts').appendChild(el);
  const all = $('#toasts').children; if (all.length > 4) all[0].remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, good ? 4200 : 3200);
}
const bubbles = $('#bubbles');
bang = document.createElement('div'); bang.className = 'bubble bang panel'; bang.textContent = '!'; bang.hidden = true; bubbles.appendChild(bang);
const vtmp = new THREE.Vector3();
function toScreen(x, y, z) { vtmp.set(x, y, z).project(camera); return [(vtmp.x * 0.5 + 0.5) * innerWidth, (-vtmp.y * 0.5 + 0.5) * innerHeight]; }
function floater(text, iconId) {
  const el = document.createElement('div'); el.className = 'floater';
  el.innerHTML = (iconId ? `<img src="${icon(iconId)}" alt="">` : '') + `<span></span>`; el.querySelector('span').textContent = text;
  const [sx, sy] = toScreen(P.x, 1.6, P.z); el.style.left = sx + 'px'; el.style.top = sy + 'px';
  bubbles.appendChild(el); setTimeout(() => el.remove(), 1350);
}
let zoneT = 0;
function showZone(name) { const z = $('#zone'); z.textContent = name; z.classList.add('on'); zoneT = 2.6; }
function renderTracker() {
  const el = $('#tracker'); const q = activeQuests()[0];
  if (!q || S.title) { el.classList.remove('on'); return; }
  let prog = '', pct = 0;
  if (q.deliver) { const [, it, n] = q.deliver; prog = `${Math.min(countItem(it), n)} / ${n} ${ITEMS[it].name}`; pct = Math.min(1, countItem(it) / n); }
  else { const v = Math.min(qProgress(q), q.n); prog = `${v} / ${q.n}`; pct = v / q.n; }
  el.innerHTML = `<b>${q.title}</b>${q.deliver ? `Livre à ${NPC_BY_ID[q.deliver[0]].name}.` : q.desc}<div class="tbar"><i style="width:${pct * 100}%"></i></div><small>${prog}</small>`;
  el.classList.add('on');
}

// ---------- Fenêtres modales
const modalWrap = $('#modal-wrap'), modal = $('#modal');
const MODAL = { kind: null, tab: null, key: null, npc: null, line: '', msg: '', type: null, res: null, pick: -1 };
function openModal(kind, extra = {}) { Object.assign(MODAL, { tab: null, msg: '', pick: -1 }, extra); S.modal = kind; MODAL.kind = kind.split(':')[0]; modalWrap.hidden = false; S.hold = false; renderModal(); const f = modal.querySelector('[data-focus]') || modal.querySelector('button'); f && f.focus(); }
function closeModal() { if (!S.modal) return; const k = S.modal; S.modal = null; modalWrap.hidden = true; canvas.focus(); renderTracker(); if (k === 'day' && S.day === 2) toast("Astuce : arrose tes cultures chaque jour (la pluie le fait pour toi).") ; }
modalWrap.addEventListener('click', e => { if (e.target === modalWrap) closeModal(); });
const money = () => `<span class="money"><span class="coin"></span>${S.gold.toLocaleString('fr-FR')} g</span>`;
const sellable = kinds => S.inv.map((s, k) => [s, k]).filter(([s]) => s && kinds.includes(ITEMS[s.id].kind) && ITEMS[s.id].sell);
const tabsHTML = (tabs, cur) => `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${cur === k}">${l}</button>`).join('')}</div>`;
const rowHTML = (ic, name, desc, price, acts, on) => `<div class="row${on ? ' on' : ''}"><img src="${ic}" alt=""><div class="nm"><b>${name}</b><small>${desc}</small></div><span class="price">${price === '' || price == null ? '' : `<span class="coin"></span>${price} g`}</span><div class="acts">${acts}</div></div>`;
const foot = (extra = '') => `<div class="mfoot">${money()}<span style="display:flex;gap:8px">${extra}<button class="btn" data-close data-focus>Fermer</button></span></div>`;
function renderModal() {
  const k = MODAL.kind; let html = '';
  if (k === 'shop') html = shopHTML(); else if (k === 'bin') html = binHTML(); else if (k === 'sleep') html = sleepHTML();
  else if (k === 'day') html = dayHTML(); else if (k === 'help') html = helpHTML(); else if (k === 'npc') html = npcHTML(NPC_BY_ID[MODAL.npc], true);
  else if (k === 'animals') html = animalsHTML(); else if (k === 'book') html = bookHTML(); else if (k === 'bag') html = bagHTML();
  const st = modal.scrollTop; modal.innerHTML = html; modal.scrollTop = st;
}

// Boutiques
function openShop(key) {
  const sh = SHOPS[key];
  if (S.time < sh.open || S.time >= sh.close) { toast(`${sh.name} est fermé. Ouvert de ${fmtH(sh.open)} à ${fmtH(sh.close)}.`); return; }
  const first = { graines: 'buy', poisson: 'sell', cafe: 'buy', boutique: 'buy' }[key];
  openModal('shop', { key, tab: first }); sfx('sel');
}
function seedDesc(it) {
  const c = CROPS[it.crop];
  return `${c.days} j · ${c.seasons.map(s => SEASONS[s]).join(' / ')} · se vend ${ITEMS[c.item].sell} g${c.regrow ? ` · repousse (${c.regrow} j)` : ''}${c.lvl > 1 ? ` · Agri. niv. ${c.lvl}` : ''}`;
}
function shopHTML() {
  const key = MODAL.key, sh = SHOPS[key], n = NPC_BY_ID[sh.npc], tab = MODAL.tab;
  const tabs = { graines: [['buy', 'Acheter'], ['sell', 'Vendre'], ['talk', 'Discuter']], poisson: [['sell', 'Vendre'], ['upg', 'Améliorer'], ['talk', 'Discuter']],
    cafe: [['buy', 'Menu'], ['sell', 'Vendre'], ['talk', 'Discuter']], boutique: [['buy', 'Acheter'], ['wear', 'Garde-robe'], ['talk', 'Discuter']] }[key];
  let rows = '';
  if (tab === 'talk') return `<h2>${sh.name}</h2>` + tabsHTML(tabs, tab) + npcInner(n) + foot();
  if (key === 'graines' && tab === 'buy') {
    for (const iid of ['s_gombo', 's_patate', 's_tomate', 's_piment', 's_giraumon', 's_ananas', 's_ganja', 'fourrage']) {
      const it = ITEMS[iid], price = priceBuy(key, it.buy), lock = it.crop && lvl('farm') < CROPS[it.crop].lvl;
      rows += rowHTML(icon(iid), it.name, it.crop ? seedDesc(it) : "Nourriture pour poules et vaches", price,
        `<button class="btn sm" data-buy="${iid}" ${S.gold < price || lock ? 'disabled' : ''}>${lock ? 'Niveau ' + CROPS[it.crop].lvl : 'Acheter'}</button>${it.crop && !lock ? `<button class="btn sm" data-buy="${iid}:5" ${S.gold < price * 5 ? 'disabled' : ''}>×5</button>` : ''}${!it.crop ? `<button class="btn sm" data-buy="${iid}:10" ${S.gold < price * 10 ? 'disabled' : ''}>×10</button>` : ''}`);
    }
  } else if (key === 'cafe' && tab === 'buy') {
    for (const iid of ['jus_coco', 'plantain', 'jerk']) {
      const it = ITEMS[iid], price = priceBuy(key, it.buy);
      rows += rowHTML(icon(iid), it.name, `Rend ${it.food} d'énergie · fait aussi un cadeau apprécié`, price, `<button class="btn sm" data-buy="${iid}" ${S.gold < price ? 'disabled' : ''}>Acheter</button>`);
    }
  } else if (key === 'boutique' && tab === 'buy') {
    const list = Object.entries(COSM).filter(([cid, c]) => c.price > 0 && !S.owned.includes(cid));
    for (const [cid, c] of list) rows += rowHTML(icon(cid), c.name, SLOT_NAMES[c.slot].replace(/s$/, ''), priceBuy(key, c.price), `<button class="btn sm" data-buyc="${cid}" ${S.gold < priceBuy(key, c.price) ? 'disabled' : ''}>Acheter</button>`);
    if (!rows) rows = `<p class="empty">Tu as toute la collection. Desta est ravie.</p>`;
  } else if (key === 'boutique' && tab === 'wear') {
    for (const slot of ['hat', 'shirt', 'gl']) {
      rows += `<div class="sect">${SLOT_NAMES[slot]}</div>`;
      for (const [cid, c] of Object.entries(COSM)) if (c.slot === slot && S.owned.includes(cid)) {
        const on = S.eq[slot] === cid;
        rows += rowHTML(icon(cid), c.name, on ? 'Porté en ce moment' : 'Dans ta garde-robe', '', `<button class="btn sm ${on ? 'green' : ''}" data-wear="${cid}" ${on ? 'disabled' : ''}>${on ? 'Porté' : 'Porter'}</button>`, on);
      }
    }
  } else if (key === 'poisson' && tab === 'upg') {
    for (const tid of ['hoe', 'can', 'rod']) {
      const t = toolTier(tid), nxt = t + 1;
      if (nxt > 2) { rows += rowHTML(icon(tid, t), TOOL_NAMES[tid][t], TOOL_HINT[tid][t] + ' · niveau maximum', '', '', true); continue; }
      const cost = Math.round(UPGRADE_COST[nxt] * (shopBonus(key) ? 0.9 : 1));
      rows += rowHTML(icon(tid, nxt), `${TOOL_NAMES[tid][nxt]}`, TOOL_HINT[tid][nxt], cost, `<button class="btn sm" data-upg="${tid}" ${S.gold < cost ? 'disabled' : ''}>Améliorer</button>`);
    }
  } else {
    for (const [s, k2] of sellable(sh.buys)) {
      const it = ITEMS[s.id], pr = priceSell(key, s.id);
      rows += rowHTML(icon(s.id), it.name, `${s.q} en stock`, pr, `<button class="btn sm" data-sell="${k2}">Vendre</button>${s.q > 1 ? `<button class="btn sm" data-sellall="${k2}">Tout</button>` : ''}`);
    }
    if (!rows) rows = `<p class="empty">${{ graines: 'Tante Pearl rachète tes légumes et fruits. Tu n\'en as pas sur toi.', poisson: 'Winston rachète le poisson. Va lancer ta ligne !', cafe: 'Zion rachète les herbes, œufs, laits et trouvailles de plage.' }[key]}</p>`;
  }
  return `<h2>${sh.name}</h2><p class="who"><b>${sh.keeper}</b> ${heartsRow(hearts(sh.npc))}<br>« ${sh.hello} »</p>` + tabsHTML(tabs, tab) + `<div class="list">${rows}</div>` + foot();
}
function binHTML() {
  let rows = '';
  for (const [s, k] of sellable(['crop', 'fish', 'herb', 'forage', 'product', 'food'])) {
    const it = ITEMS[s.id];
    rows += rowHTML(icon(s.id), it.name, `${s.q} sur toi`, it.sell, `<button class="btn sm" data-ship="${k}">Déposer</button>${s.q > 1 ? `<button class="btn sm" data-shipall="${k}">Tout</button>` : ''}`);
  }
  if (!rows) rows = `<p class="empty">Rien à expédier. Dépose ici tes récoltes, poissons, œufs : ils sont payés le lendemain matin, au prix de base.</p>`;
  const n = S.ship.reduce((a, [, q]) => a + q, 0), v = S.ship.reduce((a, [i, q]) => a + ITEMS[i].sell * q, 0);
  return `<h2>Coffre d'expédition</h2><p class="who">Le transporteur passe chaque nuit. ${n ? `Dans le coffre : <b>${n} objet${n > 1 ? 's' : ''}</b>, soit ${v} g demain matin.` : 'Le coffre est vide.'}</p><div class="list" style="margin-top:12px">${rows}</div>` + foot();
}
function sleepHTML() {
  return `<h2>Aller au hamac ?</h2><p class="who">La journée se termine et ta partie est sauvegardée. Les cultures arrosées pousseront pendant la nuit, et tes animaux produiront s'ils ont mangé.</p>
  <div class="mfoot"><span></span><span style="display:flex;gap:8px"><button class="btn" data-close>Pas encore</button><button class="btn primary" data-sleep data-focus>Dormir</button></span></div>`;
}
function openSleep() { openModal('sleep'); }
function openBin() { openModal('bin'); }
function openDayCard(res) { openModal('day', { res }); }
function dayHTML() {
  const r = MODAL.res, ssn = seasonOf(S.day), tomorrow = weatherFor(S.day + 1);
  let lines = '';
  if (r.passedOut) lines += `<li>La fatigue t'a rattrapé à 2h du matin. Un voisin t'a aidé à rentrer${r.lost ? ` (${r.lost} g de frais)` : ''}.</li>`;
  if (r.season !== null) lines += `<li><b>Nouvelle saison : ${SEASONS[ssn]}.</b> ${SEASON_DESC[ssn]}</li>`;
  if (r.dead) lines += `<li>${r.dead} culture${r.dead > 1 ? 's ont séché' : ' a séché'} : hors saison.</li>`;
  if (r.earned) lines += `<li><span class="coin"></span>Expédition payée : <b>${r.earned} g</b></li>`;
  if (r.grown) lines += `<li>${r.grown} culture${r.grown > 1 ? 's ont' : ' a'} poussé cette nuit.</li>`;
  if (r.eggs) lines += `<li>${r.eggs} œuf${r.eggs > 1 ? 's' : ''} t'attendent au poulailler.</li>`;
  if (r.milk) lines += `<li>${r.milk} bidon${r.milk > 1 ? 's' : ''} de lait à l'étable.</li>`;
  for (const u of r.ups) lines += `<li>${u} !</li>`;
  if (wet(S.weather)) lines += `<li>La pluie a arrosé tes cultures.</li>`;
  if (rainbowFor(S.day)) lines += `<li>Un arc-en-ciel est apparu au-dessus de la rivière.</li>`;
  if (dom(S.day) === 28) lines += `<li>Dernier jour de la saison : les cultures hors saison sécheront demain.</li>`;
  if (!lines) lines = `<li>Une nouvelle journée commence. Pense à arroser !</li>`;
  return `<p class="who" style="margin:0;font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-size:12px">${WEEK[(S.day - 1) % 7]} · ${SEASONS[ssn]}</p><h2>Jour ${dom(S.day)}</h2>
    <p class="who"><svg viewBox="0 0 32 32" width="22" height="22" style="vertical-align:-6px">${WX_SVG[S.weather]}</svg> Aujourd'hui : <b>${WX_NAMES[S.weather]}</b> · Demain : ${WX_NAMES[tomorrow]}</p>
    <ul class="daylines">${lines}</ul><div class="mfoot">${money()}<button class="btn primary" data-close data-focus>Commencer la journée</button></div>`;
}
function helpHTML() {
  return `<h2>Commandes</h2><dl class="keys">
    <dt><kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> / flèches</dt><dd>Marcher (<kbd>Maj</kbd> pour courir)</dd>
    <dt><kbd>Espace</kbd> / clic gauche</dt><dd>Utiliser l'objet sur la case visée (la souris peut viser une case voisine)</dd>
    <dt><kbd>E</kbd> / clic droit</dt><dd>Récolter, parler, boutiques, caresser un animal, secouer un cocotier, dormir</dd>
    <dt><kbd>1</kbd>…<kbd>0</kbd> / molette</dt><dd>Choisir un objet de la barre</dd>
    <dt><kbd>B</kbd></dt><dd>Sac à dos (30 emplacements) : clique deux cases pour les échanger</dd>
    <dt><kbd>C</kbd></dt><dd>Carnet : quêtes, compétences, amis, poissons</dd>
    <dt><kbd>F</kbd></dt><dd>Manger l'aliment sélectionné (rend de l'énergie)</dd>
    <dt><kbd>M</kbd></dt><dd>Couper ou remettre le son</dd>
    <dt>Pêche</dt><dd>Vise l'eau, attends le <b>!</b>, appuie, puis maintiens <kbd>Espace</kbd> pour garder le poisson dans la barre verte.</dd>
    <dt>Saisons</dt><dd>28 jours chacune. Chaque graine pousse dans ses saisons seulement. La pluie arrose les cultures.</dd>
    <dt>Journée</dt><dd>Les boutiques ferment en fin d'après-midi. Dors avant 2h du matin, sinon tu t'écroules.</dd>
  </dl><div class="mfoot"><span></span><button class="btn" data-close data-focus>Fermer</button></div>`;
}
function openHelp() { openModal('help'); }

// Villageois : dialogue, cadeaux, livraisons
function tasteNames(n) {
  const nm = l => l.filter(i => ITEMS[i]).slice(0, 4).map(i => ITEMS[i].name).join(', ');
  return `Adore : ${nm(n.loves)}.<br>Aime : ${nm(n.likes)}.`;
}
function npcInner(n) {
  const f = friend(n.id), h = hearts(n.id);
  const delivers = QUESTS.filter(q => q.deliver && q.deliver[0] === n.id && questActive(q));
  let html = `<p class="who"><b>${n.name}</b> ${heartsRow(h)} <small>(${f.pts % 60}/60 vers le prochain cœur)</small><br>« ${MODAL.line} »</p>`;
  if (MODAL.msg) html += `<p class="who"><b>${MODAL.msg}</b></p>`;
  for (const q of delivers) {
    const [, it, cnt] = q.deliver, have = countItem(it);
    html += `<div class="quest" style="margin-top:10px"><b>${q.title}<span>${q.gold} g</span></b><small>${q.desc}</small><button class="btn sm primary" data-deliver="${q.id}" ${have < cnt ? 'disabled' : ''}>Livrer ${cnt} × ${ITEMS[it].name} (${Math.min(have, cnt)}/${cnt})</button></div>`;
  }
  const gifts = S.inv.map((s, k) => [s, k]).filter(([s]) => s && ITEMS[s.id].kind !== 'tool');
  html += `<div class="sect">Offrir un cadeau ${f.gifted === S.day ? '<small>(déjà fait aujourd\'hui)</small>' : ''}</div>`;
  html += gifts.length ? `<div class="grid-inv">${gifts.map(([s, k]) => `<button class="slot" data-gift="${k}" title="${ITEMS[s.id].name}" ${f.gifted === S.day ? 'disabled' : ''}><img src="${icon(s.id)}" alt="">${s.q > 1 ? `<span class="q">${s.q}</span>` : ''}</button>`).join('')}</div>` : '<p class="empty">Ton sac ne contient rien à offrir.</p>';
  html += `<p class="who" style="font-size:13px;opacity:.85;margin-top:8px">${h >= 2 ? tasteNames(n) : 'Offre-lui des cadeaux pour découvrir ses goûts.'}</p>`;
  return html;
}
function npcHTML(n) { return `<div class="npc-head"><h2>${n.name}</h2></div>` + npcInner(n) + foot(); }
function openNPC(n) {
  talkNPC(n); n.talkT = 0.1;
  openModal('npc:' + n.id, { npc: n.id, line: npcLine(n) }); sfx('sel');
}

// Animaux
function openAnimals(type) { openModal('animals', { type }); }
function animalsHTML() {
  const type = MODAL.type, nm = type === 'poule' ? 'Poulailler' : 'Étable', list = animalsOf(type), cap = CAPACITY[type];
  const keys2 = type === 'poule' ? ['oeuf', 'oeuf_or'] : ['lait', 'lait_creme'], nShed = S.shed[keys2[0]] + S.shed[keys2[1]];
  let rows = list.map(a => rowHTML(icon(keys2[0]), a.name, `${a.fed ? 'A mangé' : 'A faim'} · ${a.pet ? 'câliné' : 'pas encore câliné'}<div class="bar" style="margin-top:4px"><i style="width:${a.happy}%"></i></div>`, '', `<span class="hearts">${heartSVG(a.happy >= 25)}${heartSVG(a.happy >= 50)}${heartSVG(a.happy >= 75)}</span>`)).join('');
  if (!rows) rows = `<p class="empty">Aucun ${type === 'poule' ? 'poule' : 'vache'} pour l'instant.</p>`;
  const fodder = countItem('fourrage'), price = ANIMAL_PRICE[type];
  return `<h2>${nm}</h2><p class="who">${list.length} / ${cap} ${type === 'poule' ? 'poules' : 'vaches'}. Donne du fourrage chaque jour et caresse-les (touche <kbd>E</kbd> dans l'enclos) : plus ils sont heureux, plus ils pondent ou donnent du bon.</p>
  <div class="list" style="margin-top:12px">${rows}</div>
  <div class="mfoot"><span class="money"><img src="${icon('fourrage')}" width="26" height="26" alt=""> ${fodder} fourrage · ${nShed} ${type === 'poule' ? 'œuf' : 'bidon'}${nShed > 1 ? 's' : ''} prêt${nShed > 1 ? 's' : ''}</span>
  <span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-feed ${list.length ? '' : 'disabled'}>Nourrir tous</button><button class="btn sm green" data-collect ${nShed ? '' : 'disabled'}>Ramasser</button>
  <button class="btn sm primary" data-buyanimal="${type}" ${list.length >= cap || S.gold < price ? 'disabled' : ''}>Acheter ${type === 'poule' ? 'une poule' : 'une vache'} · ${price} g</button></span></div>${foot()}`;
}

// Carnet : quêtes, compétences, amis, poissons
function openBook(tab = 'quests') { openModal('book', { tab }); }
function bookHTML() {
  const tab = MODAL.tab, tabs = [['quests', 'Quêtes'], ['skills', 'Compétences'], ['friends', 'Amis'], ['fish', 'Poissons']];
  let body = '';
  if (tab === 'quests') {
    const act = activeQuests();
    body = act.map(q => {
      let cur, tot;
      if (q.deliver) { tot = q.deliver[2]; cur = Math.min(countItem(q.deliver[1]), tot); } else { tot = q.n; cur = Math.min(qProgress(q), tot); }
      return `<div class="quest"><b>${q.title}<span>${q.gold} g${q.item ? ` + ${q.item[1]} ${ITEMS[q.item[0]].name}` : ''}</span></b><small>${q.desc}</small><div class="bar"><i style="width:${cur / tot * 100}%"></i></div><small style="margin:3px 0 0">${cur} / ${tot}</small></div>`;
    }).join('') || '<p class="empty">Toutes les quêtes sont terminées. Respect !</p>';
    const done = QUESTS.filter(q => S.done.includes(q.id));
    if (done.length) body += `<div class="sect">Terminées (${done.length})</div>` + done.map(q => `<div class="quest done"><b>${q.title}<span>✔</span></b></div>`).join('');
  } else if (tab === 'skills') {
    body = Object.entries(SKILLS).map(([k, s]) => {
      const l = lvl(k), xp = S.xp[k], a = XP_T[l - 1], b = XP_T[l] ?? a, pct = l >= 10 ? 100 : (xp - a) / (b - a) * 100;
      return `<div class="skill"><b>${s.name} · niveau ${l}</b><div class="bar"><i style="width:${pct}%"></i></div><small>${s.perks.join(' · ')}</small></div>`;
    }).join('');
  } else if (tab === 'friends') {
    body = npcs.map(n => { const f = friend(n.id); return `<div class="skill"><b>${n.name}${n.shop ? ` <small>· ${SHOPS[n.shop].name}</small>` : ''}</b><span style="justify-self:end">${f.met ? heartsRow(hearts(n.id)) : '<small>Pas encore rencontré</small>'}</span><small>${f.met && hearts(n.id) >= 2 ? tasteNames(n) : 'Parle-lui et offre-lui des cadeaux.'}</small></div>`; }).join('');
  } else {
    body = `<div class="list">${Object.entries(ITEMS).filter(([, it]) => it.kind === 'fish').map(([fid, it]) => {
      const L = S.fishLog[fid];
      return `<div class="row${L ? ' on' : ''}"><img src="${icon(fid)}" alt="" style="${L ? '' : 'filter:brightness(0) opacity(.35)'}"><div class="nm"><b>${L ? it.name : '???'}</b><small>${L ? `${L.n} pêché${L.n > 1 ? 's' : ''} · record ${L.max} cm` : 'Pas encore pêché'}</small></div><span class="price">${L ? `<span class="coin"></span>${it.sell} g` : ''}</span><span></span></div>`;
    }).join('')}</div>`;
  }
  return `<h2>Carnet</h2>` + tabsHTML(tabs, tab) + body + foot();
}

// Sac à dos : clique une case, puis une autre pour les échanger
function openBag() { openModal('bag'); }
function bagHTML() {
  const cells = S.inv.map((s, k) => {
    const { lab, inner } = slotHTML(s, k + 99);
    return `<button class="slot${MODAL.pick === k ? ' pick' : ''}${k < 10 ? ' sel' : ''}" data-bag="${k}" title="${lab}" aria-label="${lab}">${inner}</button>`;
  }).join('');
  return `<h2>Sac à dos</h2><p class="who">Les 10 premières cases forment ta barre d'objets (cadre jaune). Clique une case puis une autre pour les échanger.</p>
  <div class="grid-inv" style="margin-top:12px">${cells}</div>${foot('<button class="btn sm" data-sort>Trier</button>')}`;
}

// Actions des fenêtres (délégation d'événements)
modal.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const d = b.dataset;
  if ('close' in d) { closeModal(); return; }
  if ('sleep' in d) { sleepNow(false); return; }
  if (d.tab) {
    MODAL.tab = d.tab; MODAL.msg = '';
    if (d.tab === 'talk') { const n = NPC_BY_ID[SHOPS[MODAL.key].npc]; talkNPC(n); MODAL.line = npcLine(n); }
    renderModal(); return;
  }
  if (d.buy) {
    const [iid, cnt] = d.buy.split(':'), n = +(cnt || 1), it = ITEMS[iid], price = priceBuy(MODAL.key, it.buy) * n;
    if (S.gold < price) return;
    if (!addItem(iid, n)) { toast('Ton sac est plein.'); return; }
    S.gold -= price; sfx('coin'); renderHotbar(); renderModal(); renderTracker(); return;
  }
  if (d.buyc) {
    const c = COSM[d.buyc], price = priceBuy(MODAL.key, c.price); if (S.gold < price) return;
    S.gold -= price; S.owned.push(d.buyc); bump('bought_cosm'); sfx('coin'); toast(`${c.name} ajouté à ta garde-robe.`, true); renderModal(); return;
  }
  if (d.wear) { const c = COSM[d.wear]; S.eq[c.slot] = d.wear; buildPlayer(); sfx('sel'); renderModal(); return; }
  if (d.upg) {
    const t = toolTier(d.upg), nxt = t + 1, cost = Math.round(UPGRADE_COST[nxt] * (shopBonus(MODAL.key) ? 0.9 : 1)); if (S.gold < cost) return;
    const slot = S.inv.find(s => s && s.id === d.upg); S.gold -= cost; slot.t = nxt; bump('upgrades');
    if (d.upg === 'can') S.water = canMax(nxt);
    buildPlayer(); sfx('level'); toast(`${TOOL_NAMES[d.upg][nxt]} : ${TOOL_HINT[d.upg][nxt]}.`, true); renderHotbar(); renderModal(); return;
  }
  if (d.sell || d.sellall) {
    const k = +(d.sell || d.sellall), s = S.inv[k]; if (!s) return;
    const n = d.sellall ? s.q : 1, gain = priceSell(MODAL.key, s.id) * n; addGold(gain, true); takeFrom(k, n); sfx('coin'); renderModal(); return;
  }
  if (d.ship || d.shipall) {
    const k = +(d.ship || d.shipall), s = S.inv[k]; if (!s) return;
    const n = d.shipall ? s.q : 1, ex = S.ship.find(e2 => e2[0] === s.id);
    if (ex) ex[1] += n; else S.ship.push([s.id, n]);
    takeFrom(k, n); sfx('plant'); renderModal(); return;
  }
  if (d.gift) {
    const n = NPC_BY_ID[MODAL.kind === 'npc' ? MODAL.npc : SHOPS[MODAL.key].npc];
    MODAL.msg = giveGift(n, +d.gift); renderModal(); renderTracker(); checkQuests(); return;
  }
  if (d.deliver) {
    const q = QUESTS.find(x => x.id === d.deliver), [nid, it, cnt] = q.deliver;
    if (countItem(it) >= cnt) { takeItem(it, cnt); completeQuest(q); MODAL.msg = ''; renderModal(); }
    return;
  }
  if ('feed' in d) { feedAll(MODAL.type); renderModal(); return; }
  if ('collect' in d) { collectShed(MODAL.type); renderModal(); return; }
  if (d.buyanimal) { buyAnimal(d.buyanimal); renderModal(); return; }
  if (d.bag !== undefined) {
    const k = +d.bag;
    if (MODAL.pick < 0) MODAL.pick = k;
    else { [S.inv[MODAL.pick], S.inv[k]] = [S.inv[k], S.inv[MODAL.pick]]; MODAL.pick = -1; }
    renderHotbar(); renderModal(); return;
  }
  if ('sort' in d) {
    const order = { tool: 0, seed: 1, feed: 2, crop: 3, herb: 3, fish: 4, product: 5, forage: 6, food: 7 };
    const items = S.inv.filter(Boolean).sort((a, b) => (order[ITEMS[a.id].kind] - order[ITEMS[b.id].kind]) || a.id.localeCompare(b.id));
    S.inv = items.concat(new Array(INV_SIZE - items.length).fill(null)); renderHotbar(); renderModal();
  }
});

// ---------- HUD
const lastHud = { k: '' };
function updateHUD(ripe) {
  const it = !busy() && !S.fish.phase ? nearestInteract() : null;
  let pr = '';
  if (S.fish.phase === 'wait') pr = 'Espace · Remonter la ligne';
  else if (S.fish.phase === 'bite') pr = 'Espace · Ferrer !';
  else if (S.fish.phase === 'game') pr = 'Maintiens Espace pour monter la barre';
  else if (ripe) pr = 'Espace ou E · Récolter';
  else if (it) pr = `E · ${it.label}`;
  const pe = $('#prompt'); if (pe.textContent !== pr) { pe.textContent = pr; pe.classList.toggle('on', !!pr); }
  const h = `${S.day}|${Math.floor(S.time / 10)}|${S.gold}|${Math.round(S.energy)}|${S.weather}`;
  if (h === lastHud.k) return; lastHud.k = h;
  $('#cl-wd').textContent = WEEK[(S.day - 1) % 7]; $('#cl-d').textContent = dom(S.day);
  $('#cl-season').textContent = SEASONS[seasonOf(S.day)];
  $('#cl-t').textContent = fmtH(S.time); $('#cl-g').textContent = S.gold.toLocaleString('fr-FR') + ' g';
  $('#cl-sun').style.background = S.time >= 1170 || S.time < 330 ? '#c9d3ff' : '#f6c026';
  $('#cl-wx').innerHTML = WX_SVG[S.weather]; $('#cl-wx').setAttribute('aria-label', WX_NAMES[S.weather]);
  const ef = $('#en-fill'); ef.style.height = (S.energy / MAX_EN * 100) + '%'; ef.style.background = S.energy < 25 ? '#e2362f' : S.energy < 50 ? '#f6c026' : '#2fa84f';
}
$('#help-btn').addEventListener('click', () => { if (!S.title && !S.modal) openHelp(); });
$('#book-btn').addEventListener('click', () => { if (!S.title && !S.modal) openBook(); });
$('#bag-btn').addEventListener('click', () => { if (!S.title && !S.modal) openBag(); });
