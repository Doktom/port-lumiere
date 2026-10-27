// =====================================================================
// Interface : scènes, atelier, chantiers, verrous, talents, légende
// =====================================================================
const SPEAKER_COL = { 'Lettre de Tonton Dub': '#f6c026', 'Mama Ivy': '#8a4fd6', 'Inspecteur Babylone': '#7b8494', 'Zion': '#2fa84f', 'Capitaine Winston': '#17a9c7', 'Delroy': '#e2362f', 'RastaBabylone': '#3f9d57', 'Narrateur': '#241a2e' };
function extraModalHTML(k) {
  if (k === 'cut') return cutHTML(); if (k === 'craft') return craftHTML(); if (k === 'build') return buildHTML();
  if (k === 'lock') return lockHTML(); if (k === 'farmup') return farmupHTML(); if (k === 'menu') return menuHTML();
  return '';
}
function cutHTML() {
  if (!MODAL.cut) return '';
  const c = MODAL.cut, [who, text] = c.lines[MODAL.idx], last = MODAL.idx >= c.lines.length - 1;
  return `<div class="cut"><span class="cut-who" style="--who:${SPEAKER_COL[who] || '#e2362f'}">${who}</span><p class="cut-text">${text}</p>
  <div class="mfoot"><small class="cut-n">${MODAL.idx + 1} / ${c.lines.length}</small><button class="btn primary" data-cutnext data-focus>${last ? 'Terminer' : 'Suite'}</button></div></div>`;
}
function cutNext() {
  const c = MODAL.cut; if (!c) return;
  if (MODAL.idx < c.lines.length - 1) { MODAL.idx++; renderModal(); modal.querySelector('[data-focus]')?.focus(); return; }
  MODAL.cut = null; closeModal(); if (c.onEnd) c.onEnd();
}
const needList = need => Object.entries(need).map(([i2, q]) => { const h = countItem(i2), ok = h >= q; return `<span class="need ${ok ? 'ok' : 'ko'}"><img src="${icon(i2)}" alt="">${q} ${ITEMS[i2].name} <small>(${h})</small></span>`; }).join('');
function openCraft(tab = 'atelier') { openModal('craft', { tab }); }
function craftHTML() {
  const tab = MODAL.tab;
  const rows = RECIPES.filter(r => r.tab === tab).map(r => {
    const it = ITEMS[r.id], lock = !recipeOk(r), ok1 = canCraft(r, 1), ok5 = canCraft(r, 5);
    const desc = lock ? `Artisanat niveau ${r.lvl}` : `${r.hint ? r.hint + ' ' : ''}${it.food ? `Rend ${it.food} d'énergie. ` : ''}${it.sell ? `Se vend ${sellOf(r.id)} g.` : ''}`;
    return `<div class="row${ok1 ? ' on' : ''}"><img src="${icon(r.id)}" alt=""><div class="nm"><b>${it.name}${r.out > 1 ? ` ×${r.out}` : ''}</b><small>${desc}</small><div class="needs">${needList(r.need)}</div></div><span class="price"></span>
      <div class="acts"><button class="btn sm" data-craft="${r.id}:1" ${ok1 ? '' : 'disabled'}>${lock ? 'Verrouillé' : 'Fabriquer'}</button><button class="btn sm" data-craft="${r.id}:5" ${ok5 ? '' : 'disabled'}>×5</button></div></div>`;
  }).join('');
  const note = tab === 'cuisine' ? `<p class="who">${S.inside ? 'Le réchaud est chaud. Bon appétit !' : '<b>La cuisine se fait chez toi.</b> Rentre dans ta case pour cuisiner.'}</p>` : `<p class="who">Fabrique avec le bois, la pierre et la fibre que tu ramasses en dégageant les débris (machette et pioche).</p>`;
  return `<h2>Artisanat <small style="font-size:15px">· niveau ${lvl('craft')}</small></h2>${tabsHTML([['atelier', 'Atelier'], ['cuisine', 'Cuisine']], tab)}${note}<div class="list">${rows}</div>${foot()}`;
}
function openBuild(type) { openModal('build', { type }); }
function buildHTML() {
  const type = MODAL.type, b = BUILDS[type], st = buildOk(type);
  const reqs = [[`Chapitre ${b.ch} de la légende`, S.story.ch >= b.ch], [`Niveau de joueur ${b.pl}`, plvl() >= b.pl], ...(b.after ? [[`${BUILDS[b.after].name} construit`, S.built[b.after]]] : []), [`${b.gold} g`, S.gold >= b.gold]];
  const busy = S.building === type ? `<p class="who"><b>Chantier en cours :</b> le ${b.name.toLowerCase()} sera prêt demain matin.</p>` : '';
  return `<h2>${b.name} · chantier</h2><p class="who">Une dalle, quelques poteaux et beaucoup de bonne volonté. Les potes de Zion construisent pendant la nuit si tu apportes le matériel.</p>
  <ul class="daylines">${reqs.map(([t, ok]) => `<li>${ok ? '✔' : '✘'} ${t}</li>`).join('')}</ul><div class="needs">${needList(b.need)}</div>${busy}
  <div class="mfoot">${money()}<span style="display:flex;gap:8px"><button class="btn" data-close>Fermer</button><button class="btn primary" data-build="${type}" ${st.ok ? '' : 'disabled'} data-focus>Lancer le chantier</button></span></div>${st.ok || S.building === type ? '' : `<p class="who"><small>${st.why}</small></p>`}`;
}
function openLock(key) { openModal('lock', { key }); }
function lockHTML() {
  const key = MODAL.key, L = LOCKS[key], st = lockOk(key);
  return `<h2>${L.name}</h2><p class="who">${L.desc}</p>${L.need ? `<div class="needs">${needList(L.need)}</div>` : `<p class="who">${S.story.flags.permis ? '✔ Tu as le permis du Ministère.' : '✘ Il te faut le permis du Ministère des Formulaires.'}</p>`}
  <div class="mfoot">${money()}<span style="display:flex;gap:8px"><button class="btn" data-close>Fermer</button><button class="btn primary" data-unlock="${key}" ${st.ok ? '' : 'disabled'} data-focus>${L.need ? 'Réparer' : 'Montrer le permis'}</button></span></div>`;
}
function openFarmUp() { openModal('farmup'); }
function farmupHTML() {
  const u = FARM_UPG[S.farmLvl + 1], st = farmUpgradeOk(), r = fieldRect();
  if (!u) return `<h2>Ton yard</h2><p class="who">Ton champ fait déjà ${fieldSize()} cases, le maximum. Tonton Dub serait fier.</p>${foot()}`;
  const nr = FARM_RECTS[S.farmLvl + 1], next = (nr[2] - nr[0] + 1) * (nr[3] - nr[1] + 1);
  return `<h2>Agrandir le yard</h2><p class="who">Champ actuel : <b>${fieldSize()} cases</b> (niveau ${S.farmLvl + 1}/4). Prochain palier : <b>${next} cases</b>. Les débris restés dans la nouvelle zone devront être dégagés.</p>
  <ul class="daylines"><li>${plvl() >= u.pl ? '✔' : '✘'} Niveau de joueur ${u.pl}</li><li>${S.gold >= u.gold ? '✔' : '✘'} ${u.gold} g</li></ul><div class="needs">${needList(u.need)}</div>
  <div class="mfoot">${money()}<span style="display:flex;gap:8px"><button class="btn" data-close>Fermer</button><button class="btn primary" data-farmup ${st.ok ? '' : 'disabled'} data-focus>Agrandir</button></span></div>${st.ok ? '' : `<p class="who"><small>${st.why}</small></p>`}`;
}
function talentsHTML() {
  const pts = talentPoints();
  let h = `<p class="who">Niveau de joueur <b>${plvl()}</b> · énergie max ${maxEn()} · <b>${pts}</b> point${pts > 1 ? 's' : ''} de talent à dépenser (1 par niveau de compétence).</p>`;
  for (const [sk, list] of Object.entries(TALENTS)) {
    h += `<div class="sect">${SKILLS[sk].name} · niv. ${lvl(sk)}</div>`;
    h += list.map(t => `<div class="row${tal(t.id) ? ' on' : ''}"><span class="rank">${'★'.repeat(tal(t.id))}${'☆'.repeat(3 - tal(t.id))}</span><div class="nm"><b>${t.name}</b><small>${t.desc}</small></div><span></span><div class="acts"><button class="btn sm" data-tal="${t.id}" ${pts > 0 && tal(t.id) < 3 ? '' : 'disabled'}>+1</button></div></div>`).join('');
  }
  return h;
}
function legendHTML() {
  const st = S.story, c = CHAPTERS[Math.min(st.ch, 5)];
  let h = `<p class="who"><b>Chapitre ${Math.min(st.ch, 5)} · ${c.title}</b><br>${c.goal}</p>`;
  h += `<div class="sect">Les sept éclats (${st.frags.length}/7)</div><div class="list">`;
  h += FRAGS.map(f => { const got = hasFrag(f.id); return `<div class="row${got ? ' on' : ''}"><span class="frag ${got ? 'got' : ''}"></span><div class="nm"><b>${got ? f.name : '???'}</b><small>${f.hint}</small></div><span></span><span>${got ? '✔' : ''}</span></div>`; }).join('') + '</div>';
  h += `<div class="sect">La légende</div>` + LORE.slice(0, c.lore).map(t => `<p class="who">${t}</p>`).join('');
  return h;
}
modal.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const d = b.dataset;
  if ('cutnext' in d) { cutNext(); return; }
  if (d.craft) { const [rid, n] = d.craft.split(':'); craft(rid, +n); renderModal(); renderHotbar(); return; }
  if (d.build) { startBuild(d.build); renderModal(); return; }
  if (d.unlock) { unlock(d.unlock); closeModal(); return; }
  if ('farmup' in d) { upgradeFarm(); renderModal(); return; }
  if (d.tal) { learnTalent(d.tal); renderModal(); return; }
});
