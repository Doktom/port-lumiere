// =====================================================================
// Menu : pause, sauvegardes, paramètres, mode Test
// =====================================================================
const SET_KEY = 'irie-settings';
const SET = { music: 0.7, sfx: 0.8, amb: 0.7, mute: false, quality: 'auto', fps: false, test: false, speed: 1 };
try { Object.assign(SET, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); } catch (e) {}
function saveSettings() { try { localStorage.setItem(SET_KEY, JSON.stringify(SET)); } catch (e) {} }
function applySettings() {
  muted = SET.mute;
  if (AU.master) AU.master.gain.setTargetAtTime(muted ? 0 : 0.9, AC.currentTime, 0.05);
  if (AU.sfx) AU.sfx.gain.value = SET.sfx;
  if (SET.quality === 'high') { QUALITY.reflect = true; if (PR !== QUALITY.pr) { PR = QUALITY.pr; resize(); } }
  if (SET.quality === 'low') { QUALITY.reflect = false; if (PR !== 1) { PR = 1; resize(); } }
  $('#fps').hidden = !SET.fps; $('#test-btn').hidden = !SET.test;
  if (!SET.test) { S.godEnergy = false; SET.speed = 1; }
}

// ---------- Emplacements de sauvegarde
const SLOT_KEY = n => `irie-bay-s${n}`, LAST_KEY = 'irie-last';
function readSlot(n) { try { const s = localStorage.getItem(SLOT_KEY(n)); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function writeSlot(n, data) {
  try { localStorage.setItem(SLOT_KEY(n), JSON.stringify(data)); localStorage.setItem(LAST_KEY, String(n)); return true; }
  catch (e) { toast('Sauvegarde impossible : le stockage du navigateur est bloqué ou plein.'); return false; }
}
function deleteSlot(n) { try { localStorage.removeItem(SLOT_KEY(n)); } catch (e) {} }
function lastSlot() { try { return +(localStorage.getItem(LAST_KEY) || 0); } catch (e) { return 0; } }
function migrateLegacy() { try { const old = localStorage.getItem('irie-bay-v2'); if (old && !readSlot(1)) { localStorage.setItem(SLOT_KEY(1), old); localStorage.setItem(LAST_KEY, '1'); } } catch (e) {} }
function slotMeta(d) {
  if (!d) return 'Emplacement vide';
  const xp = Object.values(d.xp || {}).reduce((a, b) => a + b, 0), pl = Math.min(MAX_PL, 1 + Math.floor(Math.sqrt(xp / 45)));
  const when = d.savedAt ? ' · ' + new Date(d.savedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return `${SEASONS[seasonOf(d.day)]} jour ${dom(d.day)} · ${(d.gold || 0).toLocaleString('fr-FR')} g · niveau ${pl} · chapitre ${(d.story && d.story.ch) || 1}${when}`;
}
function saveNow() { if (S.title) return; if (writeSlot(S.slot, { ...serialize(true), savedAt: Date.now() })) toast(`Partie sauvegardée (emplacement ${S.slot}).`, true); }
const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = t => JSON.parse(decodeURIComponent(escape(atob(t.trim()))));

function openMenu(tab = 'main', mode = null) { openModal('menu', { tab, mode, confirm: 0, exp: 0 }); }
function menuHTML() {
  const tab = MODAL.tab, ingame = !S.title;
  const tabs = [['main', 'Menu'], ['saves', 'Sauvegardes'], ['settings', 'Paramètres'], ['help', 'Commandes']];
  if (SET.test && ingame) tabs.push(['test', 'Mode Test']);
  let body = '';
  if (tab === 'main') {
    body = `<div class="menu-grid">
      ${ingame ? '<button class="btn primary" data-m="resume" data-focus>Reprendre</button><button class="btn" data-m="save">Sauvegarder</button>' : ''}
      <button class="btn" data-m="tab:saves">Sauvegardes</button><button class="btn" data-m="tab:settings">Paramètres</button><button class="btn" data-m="tab:help">Commandes</button>
      <button class="btn" data-m="mute">${SET.mute ? 'Remettre le son' : 'Couper le son'}</button>
      ${SET.test && ingame ? '<button class="btn" data-m="tab:test">Mode Test</button>' : ''}
      ${ingame ? '<button class="btn" data-m="title">Écran titre</button>' : ''}</div>
      ${ingame ? `<p class="who"><small>Emplacement ${S.slot}. La partie est aussi sauvegardée automatiquement chaque fois que tu dors.</small></p>` : ''}`;
  } else if (tab === 'saves') {
    const mode = MODAL.mode;
    body = `<p class="who">${mode === 'new' ? 'Choisis un emplacement pour ta nouvelle partie.' : mode === 'load' ? 'Choisis la partie à reprendre.' : 'Trois emplacements, stockés dans ce navigateur.'}</p><div class="list">`;
    for (let n = 1; n <= 3; n++) {
      const d = readSlot(n), cur = ingame && S.slot === n, conf = MODAL.confirm === n;
      let acts = '';
      if (mode === 'new') acts = d && !conf ? `<button class="btn sm" data-m="ask:${n}">Écraser</button>` : `<button class="btn sm primary" data-m="new:${n}">${d ? 'Confirmer' : 'Commencer ici'}</button>`;
      else {
        if (d) acts += `<button class="btn sm" data-m="load:${n}">Charger</button>`;
        if (ingame) acts += `<button class="btn sm" data-m="saveto:${n}">Sauver ici</button>`;
        if (d) acts += `<button class="btn sm" data-m="exp:${n}">Exporter</button>` + (conf ? `<button class="btn sm" data-m="del:${n}">Confirmer</button>` : `<button class="btn sm" data-m="ask:${n}">Supprimer</button>`);
      }
      body += `<div class="row${cur ? ' on' : ''}"><span class="slotnum">${n}</span><div class="nm"><b>Emplacement ${n}${cur ? ' · en cours' : ''}</b><small>${slotMeta(d)}</small></div><span></span><div class="acts">${acts}</div></div>`;
    }
    body += '</div>';
    if (MODAL.exp) body += `<div class="sect">Code de la sauvegarde ${MODAL.exp}</div><textarea id="exp-txt" class="code" readonly rows="3">${enc(readSlot(MODAL.exp))}</textarea><button class="btn sm" data-m="copy">Copier</button>`;
    if (mode !== 'new') body += `<div class="sect">Importer un code</div><textarea id="imp-txt" class="code" rows="3" placeholder="Colle ici un code exporté"></textarea>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${[1, 2, 3].map(n => `<button class="btn sm" data-m="imp:${n}">Importer dans ${n}</button>`).join('')}</div>`;
  } else if (tab === 'settings') {
    const sl = (k, lab) => `<label class="set"><span>${lab}</span><input type="range" min="0" max="100" value="${Math.round(SET[k] * 100)}" data-set="${k}" id="set-${k}"><b>${Math.round(SET[k] * 100)}</b></label>`;
    const ck = (k, lab, sub) => `<label class="set chk"><input type="checkbox" data-set="${k}" id="set-${k}" ${SET[k] ? 'checked' : ''}><span>${lab}${sub ? `<small>${sub}</small>` : ''}</span></label>`;
    body = `<div class="sect">Son</div>${ck('mute', 'Couper tout le son')}${sl('music', 'Musique')}${sl('sfx', 'Bruitages')}${sl('amb', 'Ambiance')}
      <div class="sect">Graphismes</div><label class="set"><span>Qualité</span><select data-set="quality" id="set-quality">
      ${[['auto', 'Automatique'], ['high', 'Haute (reflets)'], ['low', 'Basse (fluide)']].map(([v, l]) => `<option value="${v}" ${SET.quality === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${ck('fps', 'Afficher les images par seconde')}
      <div class="sect">Avancé</div>${ck('test', 'Mode Test', 'Ajoute un onglet pour tester le jeu : argent, saisons, météo, déblocages, téléportation.')}`;
  } else if (tab === 'help') {
    body = helpHTML().replace(/^<h2>Commandes<\/h2>/, '').replace(/<div class="mfoot">[\s\S]*$/, '');
  } else if (tab === 'test') {
    const b = (a, l) => `<button class="btn sm" data-t="${a}">${l}</button>`;
    body = `<p class="who">Outils de test. Ils modifient la partie en cours ; sauvegarde à part si tu veux garder ta vraie partie.</p>
      <div class="sect">Ressources</div><div class="tgrid">${b('gold', '+10 000 g')}${b('mats', 'Matériaux et produits')}${b('energy', S.godEnergy ? 'Énergie infinie : oui' : 'Énergie infinie : non')}${b('levels', '+1 niveau partout')}</div>
      <div class="sect">Temps</div><div class="tgrid">${b('hour', '+3 heures')}${b('day', 'Jour suivant')}${b('season', 'Saison suivante')}${b('grow', 'Tout fait pousser')}${[1, 5, 20].map(s => b('speed:' + s, `Vitesse ×${s}${SET.speed === s ? ' ✔' : ''}`)).join('')}</div>
      <div class="sect">Météo</div><div class="tgrid">${['sun', 'cloud', 'rain', 'storm'].map(w => b('w:' + w, WX_NAMES[w])).join('')}</div>
      <div class="sect">Progression</div><div class="tgrid">${b('unlock', 'Tout débloquer')}${b('chapter', 'Chapitre suivant')}${b('frags', 'Donner les 7 éclats')}${b('night', 'Aller à 21h')}</div>
      <div class="sect">Téléportation</div><div class="tgrid">${[['farm', 'Yard'], ['village', 'Place'], ['cafe', 'Café'], ['beach', 'Plage'], ['pier', 'Jetée'], ['light', 'Phare']].map(([k, l]) => b('tp:' + k, l)).join('')}</div>`;
  }
  return `<h2>${S.title ? 'Irie Bay' : 'Pause'}</h2>` + tabsHTML(tabs, tab) + body + `<div class="mfoot">${ingame ? money() : '<span></span>'}<button class="btn" data-close>Fermer</button></div>`;
}
const TP = { farm: [11, 14.5], village: [63.5, 28], cafe: [80, 38.2], beach: [57, 48], pier: [63.5, 50.5], light: [86.5, 46.5] };
function testAction(a) {
  const [k, v] = a.split(':');
  if (k === 'gold') S.gold += 10000;
  else if (k === 'mats') for (const [i2, q] of [['bois', 60], ['pierre', 60], ['fibre', 60], ['planche', 20], ['corde', 10], ['fourrage', 20], ['engrais', 10], ['appat', 20], ['coco', 10], ['oeuf', 3], ['lait', 3], ['piment', 3], ['ananas', 2]]) addItem(i2, q);
  else if (k === 'energy') { S.godEnergy = !S.godEnergy; S.energy = maxEn(); }
  else if (k === 'levels') for (const sk in S.xp) { const l = lvl(sk); if (l < 10) S.xp[sk] = XP_T[l]; }
  else if (k === 'hour') S.time = Math.min(1550, S.time + 180);
  else if (k === 'night') S.time = 1260;
  else if (k === 'day') { closeModal(); sleepNow(false); return; }
  else if (k === 'season') { S.day = (seasonOf(S.day) + 1) * 28 + Math.floor((S.day - 1) / 112) * 112; closeModal(); sleepNow(false); return; }
  else if (k === 'grow') { for (const [pk, p] of plots) if (p.crop) { p.crop.age = CROPS[p.crop.type].days; refreshPlot(pk); } }
  else if (k === 'speed') SET.speed = +v;
  else if (k === 'w') S.weather = v;
  else if (k === 'unlock') { for (const key in S.unlocked) S.unlocked[key] = true; S.built.coop = S.built.barn = true; S.farmLvl = 3; S.story.flags.permis = true; if (S.story.ch < 2) S.story.ch = 2; refreshLocks(); refreshBuildings(); rebuildStakes(); }
  else if (k === 'chapter') { if (S.story.ch < 5) { S.story.ch++; if (S.story.ch >= 4) S.story.flags.permis = true; } }
  else if (k === 'frags') { S.story.frags = FRAGS.map(f => f.id); S.story.flags.lighthouseTop = true; S.story.flags.permis = true; if (S.story.ch < 4) S.story.ch = 4; }
  else if (k === 'tp') { [P.x, P.z] = TP[v]; closeModal(); return; }
  renderHotbar(); renderTracker(); if (S.modal) renderModal();
}
modal.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const d = b.dataset;
  if (d.t) { testAction(d.t); return; }
  if (!d.m) return;
  const [a, v] = d.m.split(':'), n = +v;
  if (a === 'resume') closeModal();
  else if (a === 'save') { saveNow(); renderModal(); }
  else if (a === 'tab') { MODAL.tab = v; MODAL.confirm = 0; MODAL.exp = 0; renderModal(); }
  else if (a === 'mute') { setMuted(!SET.mute); renderModal(); }
  else if (a === 'title') { saveNow(); location.reload(); }
  else if (a === 'ask') { MODAL.confirm = n; renderModal(); }
  else if (a === 'del') { deleteSlot(n); MODAL.confirm = 0; renderModal(); refreshTitleButtons(); }
  else if (a === 'saveto') { S.slot = n; saveNow(); renderModal(); }
  else if (a === 'exp') { MODAL.exp = n; renderModal(); }
  else if (a === 'copy') { const t = $('#exp-txt'); navigator.clipboard?.writeText(t.value).then(() => toast('Code copié.'), () => { t.select(); }); }
  else if (a === 'imp') {
    try { const data = dec($('#imp-txt').value); if (!data || !data.day) throw 0; writeSlot(n, data); toast(`Code importé dans l'emplacement ${n}.`, true); renderModal(); refreshTitleButtons(); }
    catch (er) { toast("Ce code n'est pas une sauvegarde valide d'Irie Bay."); }
  }
  else if (a === 'load') { const data = readSlot(n); if (!data) return; closeModal(); audio(); startGame(data, n); }
  else if (a === 'new') { closeModal(); audio(); startGame(null, n); }
});
modal.addEventListener('input', e => {
  const el = e.target, k = el.dataset && el.dataset.set; if (!k) return;
  if (el.type === 'range') { SET[k] = el.value / 100; const lab = el.parentElement.querySelector('b'); if (lab) lab.textContent = el.value; }
  else if (el.type === 'checkbox') SET[k] = el.checked;
  else SET[k] = el.value;
  saveSettings(); applySettings();
  if (k === 'test' || k === 'mute' || k === 'quality') renderModal();
});
function refreshTitleButtons() {
  const last = lastSlot(), data = last ? readSlot(last) : null, b = $('#btn-continue');
  b.hidden = !data; if (data) { b.textContent = `Continuer · ${SEASONS[seasonOf(data.day)]} jour ${dom(data.day)}`; b.onclick = () => { audio(); startGame(data, last); }; }
  $('#btn-load').hidden = ![1, 2, 3].some(n => readSlot(n));
}
let fpsAcc = 0, fpsN = 0;
function updateFPS(rawDt) {
  if (!SET.fps) return; fpsAcc += rawDt; fpsN++;
  if (fpsAcc >= 0.5) { $('#fps').textContent = `${Math.round(fpsN / fpsAcc)} i/s${QUALITY.reflect ? '' : ' · sans reflets'}`; fpsAcc = 0; fpsN = 0; }
}
