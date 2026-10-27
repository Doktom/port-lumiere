// =====================================================================
// Lumière du jour, saisons, météo
// =====================================================================
const C3 = h => new THREE.Color(h);
const KEYS = [
  [300, { sun: '#ff9f7a', si: 0.9, sky: '#3b3a6b', hs: '#8d7ab0', hg: '#3a3150', hi: 0.75, w: '#cdb8dc', win: 1, grade: [1.04, 0.95, 1.06], glow: 0.3, gc: '#ff8aa0' }],
  [390, { sun: '#ffc49a', si: 1.9, sky: '#f6b99c', hs: '#ffd8bd', hg: '#6c6a7a', hi: 0.95, w: '#ffe0d0', win: 0.25, grade: [1.1, 0.98, 0.92], glow: 0.5, gc: '#ffb066' }],
  [480, { sun: '#fff1dc', si: 2.5, sky: '#8fdcf2', hs: '#d6ecff', hg: '#7c9a6c', hi: 1.05, w: '#ffffff', win: 0, grade: [1.03, 1.01, 0.98], glow: 0.1, gc: '#ffe7a0' }],
  [960, { sun: '#fff1dc', si: 2.5, sky: '#8fdcf2', hs: '#d6ecff', hg: '#7c9a6c', hi: 1.05, w: '#ffffff', win: 0, grade: [1.03, 1.01, 0.98], glow: 0.1, gc: '#ffe7a0' }],
  [1080, { sun: '#ffb36b', si: 2.2, sky: '#f5b07c', hs: '#ffd2a8', hg: '#7a6a5a', hi: 0.95, w: '#ffe8cf', win: 0.15, grade: [1.1, 0.97, 0.88], glow: 0.32, gc: '#ffa24a' }],
  [1170, { sun: '#e28aa8', si: 1.1, sky: '#a8629e', hs: '#c490c8', hg: '#4a3d5e', hi: 0.8, w: '#d6bfe8', win: 0.85, grade: [1.12, 0.92, 1.0], glow: 0.6, gc: '#ff6a7a' }],
  [1260, { sun: '#7d9ae0', si: 0.65, sky: '#1d2347', hs: '#5466b0', hg: '#1d1b33', hi: 0.62, w: '#8a9cdc', win: 1, grade: [0.9, 0.96, 1.14], glow: 0.22, gc: '#9fb8ff' }],
  [1600, { sun: '#7d9ae0', si: 0.65, sky: '#1d2347', hs: '#5466b0', hg: '#1d1b33', hi: 0.62, w: '#8a9cdc', win: 1, grade: [0.9, 0.96, 1.14], glow: 0.22, gc: '#9fb8ff' }],
].map(([t, o]) => [t, { ...o, sun: C3(o.sun), sky: C3(o.sky), hs: C3(o.hs), hg: C3(o.hg), w: C3(o.w), gc: C3(o.gc), gradeV: new THREE.Vector3(...o.grade) }]);
const SEASON_TINT = [C3('#ffffff').setRGB(1.0, 1.03, 0.98), C3('#ffffff').setRGB(1.12, 1.03, 0.8), C3('#ffffff').setRGB(0.8, 1.0, 0.96), C3('#ffffff').setRGB(0.96, 1.02, 1.1)];
const SEASON_WIND = [1.0, 0.7, 1.2, 1.9];
const winDay = new THREE.Color('#4f8fae'), winNight = new THREE.Color('#ffd58a'), lampDay = new THREE.Color('#f1e6c4'), lampNight = new THREE.Color('#fff0b0');
const grey = new THREE.Color('#8794a4');
let nightF = 0, tintCur = new THREE.Color(1, 1, 1), flash = 0, lightT = 8, thunderAt = 0;
const tmpCol = new THREE.Color(), glowP = new THREE.Vector3(), sdir = new THREE.Vector3(0.5, 1.2, 0.6).normalize();
function applyDayLight(focus, dt, tsec) {
  // météo lissée
  const w = S.weather, tgt = { cloud: w === 'cloud' ? 0.75 : wet(w) ? 1 : 0, rain: wet(w) ? 1 : 0, storm: w === 'storm' ? 1 : 0 };
  const k = Math.min(1, dt * 0.5);
  for (const n in tgt) ENV[n] += (tgt[n] - ENV[n]) * k;
  const rb = rainbowFor(S.day) && S.time < 760 && S.time > 380 ? 1 : 0; ENV.rainbow += (rb - ENV.rainbow) * Math.min(1, dt * 0.4);
  const t = clamp(S.time, 300, 1599);
  let a = KEYS[0], b = KEYS[1];
  for (let q = 0; q < KEYS.length - 1; q++) if (t >= KEYS[q][0] && t <= KEYS[q + 1][0]) { a = KEYS[q]; b = KEYS[q + 1]; break; }
  const u = (t - a[0]) / (b[0] - a[0]), A = a[1], B = b[1];
  const dull = 1 - 0.34 * ENV.cloud - 0.3 * ENV.rain - 0.2 * ENV.storm;
  sun.color.lerpColors(A.sun, B.sun, u); sun.intensity = lerp(A.si, B.si, u) * dull * 0.88;
  const skyW = clamp(ENV.cloud * 0.45 + ENV.rain * 0.4 + ENV.storm * 0.2, 0, 0.85);
  scene.background.lerpColors(A.sky, B.sky, u).lerp(grey, skyW * (1 - ENV.night * 0.6));
  hemi.color.lerpColors(A.hs, B.hs, u); hemi.groundColor.lerpColors(A.hg, B.hg, u); hemi.intensity = lerp(A.hi, B.hi, u) * (1 - 0.1 * ENV.rain) * 1.28;
  const water = waterMesh.material.uniforms;
  water.uTint.value.lerpColors(A.w, B.w, u).multiplyScalar(1 - 0.12 * ENV.rain);
  nightF = lerp(A.win, B.win, u); ENV.night = nightF;
  winMat.color.lerpColors(winDay, winNight, nightF); lampMat.color.lerpColors(lampDay, lampNight, nightF);
  // brume tropicale
  scene.fog.color.copy(scene.background).lerp(tmpCol.set('#ffffff'), 0.25 * (1 - nightF)); water.uFogCol.value.copy(scene.fog.color);
  scene.fog.near = 28 - ENV.rain * 10; scene.fog.far = 95 - ENV.rain * 35 - ENV.storm * 10; water.uFogN.value = scene.fog.near; water.uFogF.value = scene.fog.far;
  // saison : teinte du sol et du feuillage, vent
  const tt = SEASON_TINT[seasonOf(S.day)]; tintCur.lerp(tt, Math.min(1, dt * 1.2));
  groundMat.color.copy(tintCur); foliageTint(tintCur);
  WIND.uWind.value += ((SEASON_WIND[seasonOf(S.day)] + ENV.storm * 1.4 + ENV.rain * 0.3) - WIND.uWind.value) * Math.min(1, dt);
  WIND.uTime.value = tsec;
  // direction du soleil (ombres) et reflet (devant la caméra)
  const day = clamp((t - 360) / 900, 0, 1);
  sdir.set(lerp(0.9, -0.9, day), 0.95 + Math.sin(day * Math.PI) * 0.7, 0.6);
  if (nightF > 0.5 && t > 1100) sdir.lerp(tmpV3.set(-0.35, 1.2, 0.55), clamp((t - 1170) / 90, 0, 1));
  sdir.normalize();
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(sdir, 40);
  const elev = lerp(0.42, 0.9, Math.sin(day * Math.PI));
  water.uGlintDir.value.set(lerp(0.9, -0.9, day), elev, -0.75).normalize();
  water.uGlintCol.value.copy(tmpCol.lerpColors(A.gc, B.gc, u));
  water.uGlintAmt.value = (nightF > 0.6 ? 0.35 : 1) * clamp(1 - ENV.cloud * 0.6 - ENV.rain * 0.9, 0, 1);
  // halo du soleil et étalonnage de l'ambiance
  const U = post.uniforms;
  glowP.copy(camera.position).addScaledVector(water.uGlintDir.value, 120).project(camera);
  U.uGlowPos.value.set(clamp(glowP.x * 0.5 + 0.5, -0.2, 1.2), clamp(glowP.y * 0.5 + 0.5, 0.15, 1.5));
  U.uGlowCol.value.set(...tmpCol.lerpColors(A.gc, B.gc, u).toArray());
  U.uGlowAmt.value = lerp(A.glow, B.glow, u) * (1 - ENV.cloud * 0.6 - ENV.rain * 0.8) * (S.title ? 1.3 : 1);
  U.uGlowK.value = 3.4;
  U.uGrade.value.lerpVectors(A.gradeV, B.gradeV, u).multiplyScalar(1 - 0.05 * ENV.rain);
  U.uSat.value = 1.18 - 0.22 * ENV.rain - 0.1 * ENV.storm;
  // orages
  if (ENV.storm > 0.6 && !S.title) {
    lightT -= dt; if (lightT <= 0) { lightT = 5 + Math.random() * 11; flash = 1; thunderAt = tsec + 0.5 + Math.random() * 2; }
    if (thunderAt && tsec >= thunderAt) { thunderAt = 0; sfx('thunder'); }
  }
  flash = Math.max(0, flash - dt * 3.2); U.uFlash.value = (flash > 0.6 ? 0.45 : flash * 0.25) * (Math.sin(tsec * 50) > -0.5 ? 1 : 0.3);
  // feux, torches, guirlandes
  const fl = 0.85 + Math.sin(tsec * 9) * 0.08 + Math.sin(tsec * 23) * 0.05;
  fireLight.intensity = 0.8 + nightF * 2.2 + Math.sin(tsec * 11) * 0.25;
  for (const tc of torches) { tc.flame.scale.set(0.1 * fl, 0.3 * fl * (1 + Math.sin(tsec * 13 + tc.x) * 0.15), 0.1 * fl); tc.glow.material.opacity = Math.min(1, nightF * 1.1) * 0.9; tc.glow.scale.setScalar(2.3 + Math.sin(tsec * 8 + tc.x) * 0.15); }
  torches.sort((p, q) => Math.hypot(P.x - p.x, P.z - p.z) - Math.hypot(P.x - q.x, P.z - q.z));
  LIGHT_POOL.forEach((L, q) => { const tc = torches[q]; if (tc) { L.position.set(tc.x, tc.y, tc.z); L.intensity = nightF * 7 * fl; } else L.intensity = 0; });
  bulbB.material.color.setScalar(0.45 + nightF * 1.2);
  beamMat.opacity = Math.max(0, nightF - 0.4) * 0.28;
}
const tmpV3 = new THREE.Vector3();

// =====================================================================
// Entrées
// =====================================================================
function actionDown() {
  if (busy()) return;
  audio(); S.hold = true;
  const f = S.fish.phase;
  if (f === 'wait') { endFishing(); return; }
  if (f === 'bite') { startMinigame(); return; }
  if (f) return;
  useItem();
}
function actionUp() { S.hold = false; }
addEventListener('keydown', e => {
  if (S.title) { if (S.modal && e.code === 'Escape') { e.preventDefault(); closeModal(); } return; }
  if (e.code === 'Tab') return;
  if (S.modal === 'cut') { if (['Escape', 'KeyE', 'Space', 'Enter'].includes(e.code)) { e.preventDefault(); if (!e.repeat) cutNext(); } return; }
  if (S.modal) {
    if (e.code === 'Escape' || (e.code === 'KeyE' && S.modal !== 'day')) { e.preventDefault(); closeModal(); }
    if (S.modal === 'day' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); closeModal(); }
    return;
  }
  const kk = e.key.toLowerCase();
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) actionDown(); }
  else if (e.code === 'KeyE') interact();
  else if (e.code === 'KeyF') eat();
  else if (/^Digit[0-9]$/.test(e.code)) { const n = +e.code.slice(5); select(n === 0 ? 9 : n - 1); }
  else if (/^[&é"'(\-è_çà]$/.test(e.key) && !e.shiftKey && !e.ctrlKey && !e.altKey) { const m = { '&': 0, 'é': 1, '"': 2, "'": 3, '(': 4, '-': 5, 'è': 6, '_': 7, 'ç': 8, 'à': 9 }[e.key]; select(m); }
  else if (kk === 'm') { setMuted(!muted); toast(muted ? 'Son coupé' : 'Son activé'); }
  else if (kk === 'h' || e.key === '?') openHelp();
  else if (kk === 'c' || kk === 'j') openBook();
  else if (kk === 'b' || e.code === 'KeyI') openBag();
  else if (kk === 'k') openCraft();
  else if (e.code === 'Escape') openMenu();
  if (e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space') actionUp(); });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; S.hold = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') return;
  canvas.focus(); S.mouse = { x: e.clientX, y: e.clientY, t: performance.now() };
  if (e.button === 0) actionDown(); else if (e.button === 2) { audio(); interact(); }
});
addEventListener('pointerup', e => { if (e.pointerType !== 'touch' && e.button === 0) actionUp(); });
canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') S.mouse = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('wheel', e => { e.preventDefault(); if (!busy()) select(S.sel + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
const joy = { x: 0, z: 0, id: null };
if (matchMedia('(pointer: coarse)').matches) {
  const base = $('#joy'), knob = base.querySelector('i');
  const mv = e => { const r = base.getBoundingClientRect(); let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const d = Math.hypot(dx, dy), m = r.width * 0.36; if (d > m) { dx *= m / d; dy *= m / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / m; joy.z = dy / m; };
  base.addEventListener('pointerdown', e => { joy.id = e.pointerId; base.setPointerCapture(e.pointerId); mv(e); audio(); });
  base.addEventListener('pointermove', e => { if (e.pointerId === joy.id) mv(e); });
  const rel = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.z = 0; knob.style.transform = ''; };
  base.addEventListener('pointerup', rel); base.addEventListener('pointercancel', rel);
  const tu = $('#t-use'); tu.addEventListener('pointerdown', e => { e.preventDefault(); actionDown(); }); tu.addEventListener('pointerup', actionUp); tu.addEventListener('pointercancel', actionUp);
  $('#t-act').addEventListener('pointerdown', e => { e.preventDefault(); audio(); interact(); });
  $('#t-eat').addEventListener('pointerdown', e => { e.preventDefault(); eat(); });
}

// =====================================================================
// Boucle
// =====================================================================
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), focus = new THREE.Vector3();
const CAM_Y = 17, CAM_Z = 14.5;
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
let zoom = 1;
function zoneOf(x, z) {
  const i = Math.floor(x), j = Math.floor(z);
  if (inMap(i, j) && wood[id(i, j)] && j > 40) return 'La jetée';
  if (x < 34.5 && z < 45.5) return 'Ton yard';
  if (z >= 45 || (inMap(i, j) && tiles[id(i, j)] === SAND)) return 'La plage';
  if (x < 44) return 'Rivière des Saules';
  return 'Irie Bay';
}
function updatePlayer(dt, tsec) {
  let mx = 0, mz = 0;
  const free = !busy() && !S.fish.phase && S.swing <= 0;
  if (free) {
    if (keys.KeyW || keys.ArrowUp) mz -= 1; if (keys.KeyS || keys.ArrowDown) mz += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
    mx += joy.x; mz += joy.z;
  }
  const len = Math.hypot(mx, mz);
  let moving = false;
  if (len > 0.15) {
    const k = Math.max(1, len); mx /= k; mz /= k;
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 5.4 : 3.8) * Math.min(1, len);
    const nx = P.x + mx * sp * dt; if (!blocked(nx, P.z, 0.27)) P.x = nx;
    const nz = P.z + mz * sp * dt; if (!blocked(P.x, nz, 0.27)) P.z = nz;
    P.face = Math.atan2(mx, mz); S.card = Math.abs(mx) > Math.abs(mz) ? [Math.sign(mx), 0] : [0, Math.sign(mz)];
    P.walk += dt * sp * 2.4; moving = true;
  }
  const g = player.g;
  g.position.set(P.x, wood[id(Math.floor(P.x), Math.floor(P.z))] ? 0.08 : 0, P.z);
  g.rotation.y += angDiff(P.face, g.rotation.y) * Math.min(1, dt * 14);
  const sw = moving ? Math.sin(P.walk) * 0.6 : 0;
  player.legL.rotation.x = sw; player.legR.rotation.x = -sw;
  player.armL.rotation.x = -sw * 0.8;
  player.body.position.y = moving ? Math.abs(Math.sin(P.walk)) * 0.045 : Math.sin(tsec * 2) * 0.01;
  let ar = sw * 0.8;
  if (S.swing > 0) {
    S.swing -= dt; const u = clamp(1 - S.swing / S.swingDur, 0, 1), e = u * u * (3 - 2 * u);
    if (S.swingType === 'hoe') ar = lerp(-2.9, -1.1, e);
    else if (S.swingType === 'can') ar = lerp(-0.9, -1.5, Math.sin(u * Math.PI));
    else if (S.swingType === 'cast') ar = lerp(-3.4, -2.1, e);
    else ar = lerp(-0.4, -1.4, Math.sin(u * Math.PI));
  } else if (S.fish.phase) ar = -2.1 + (S.fish.phase === 'game' ? Math.sin(tsec * 18) * 0.06 : 0);
  player.armR.rotation.x = ar;
  const s = S.inv[S.sel]; const show = S.fish.phase ? 'rod' : s ? (ITEMS[s.id].kind === 'seed' ? 'seed' : s.id) : null;
  for (const k of ['hoe', 'can', 'rod', 'seed', 'machette', 'pioche']) tools[k].visible = k === show && (k !== 'seed' || S.swing > 0);
  if (tools.can.visible) tools.can.rotation.x = S.swingType === 'can' && S.swing > 0 ? -0.9 : 0;
  const inside = P.x > 7 && P.x < 15 && P.z > 5 && P.z < 12;
  const behind = P.x > 6.5 && P.x < 15.5 && P.z > 2.5 && P.z <= 5.2;
  S.inside = inside; farmUpper.visible = !(inside || behind);
  const zn = zoneOf(P.x, P.z); if (zn !== S.zone) { if (S.zone) showZone(zn); S.zone = zn; }
}
function updateTarget() {
  const pi = Math.floor(P.x), pj = Math.floor(P.z);
  let tgt = [pi + S.card[0], pj + S.card[1]];
  if (S.mouse && performance.now() - S.mouse.t < 4000 && !S.fish.phase) {
    ndc.set(S.mouse.x / innerWidth * 2 - 1, -(S.mouse.y / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const o = raycaster.ray.origin, d = raycaster.ray.direction;
    if (d.y < -0.01) { const t = -o.y / d.y, mi = Math.floor(o.x + d.x * t), mj = Math.floor(o.z + d.z * t); if (Math.abs(mi - pi) <= 1 && Math.abs(mj - pj) <= 1) tgt = [mi, mj]; }
  }
  S.target = tgt;
  const s = S.inv[S.sel], k = targetKey(), p = plots.get(k);
  const ripe = p && p.crop && cropStage(p.crop) === 3;
  const showH = !busy() && !S.fish.phase && !S.inside && (ripe || (s && ['hoe', 'can'].includes(s.id)) || (s && ITEMS[s.id].kind === 'seed'));
  highlight.visible = !!showH;
  if (showH) { highlight.position.set(tgt[0] + 0.5, waterAt(tgt[0], tgt[1]) ? -0.22 : 0.09, tgt[1] + 0.5); highlight.material.color.set(ripe ? '#ffe680' : '#ffffff'); }
  return ripe;
}
let prev = performance.now(), titleT = 0, perf = { acc: 0, n: 0, bad: 0 };
const beatFallback = t => Math.max(0, 1 - ((t * 76 / 60 / 2) % 1) * 4);
function loop(now) {
  requestAnimationFrame(loop);
  const rawDt = (now - prev) / 1000, dt = Math.min(0.05, rawDt); prev = now;
  const tsec = now / 1000;
  // qualité adaptative : coupe les reflets puis baisse la résolution si ça rame
  perf.acc += rawDt; perf.n++; updateFPS(rawDt); if (SET.quality !== 'auto') { perf.acc = 0; perf.n = 0; }
  if (perf.n >= 90) { const avg = perf.acc / perf.n; perf.acc = 0; perf.n = 0; if (avg > 0.034) { if (++perf.bad >= 2) { perf.bad = 0; if (QUALITY.reflect) QUALITY.reflect = false; else if (PR > 1.1) { PR = 1; resize(); } } } else perf.bad = 0; }
  waterMesh.material.uniforms.uTime.value = tsec;
  if (!busy()) {
    S.time += dt / MIN_SEC * (SET.test ? SET.speed : 1);
    if (S.time >= 1440 && !S.warned) { S.warned = true; toast("Il est minuit… pense à aller dormir."); }
    if (S.time >= 1560) { S.time = 1560; sleepNow(true); }
  }
  if (S.title) {
    S.time = 1095; titleT += dt;
    focus.set(30 + Math.sin(titleT * 0.05) * 22, 0, 26 + Math.sin(titleT * 0.07) * 3);
    camPos.set(focus.x, CAM_Y - 2, focus.z + CAM_Z - 1); camera.position.lerp(camPos, 0.05); camLook.lerp(focus, 0.05); camera.lookAt(camLook);
  } else {
    updatePlayer(dt, tsec); pickShells();
    if (S.hold && !S.fish.phase && S.swing <= 0) { const s = S.inv[S.sel]; if (s && ['hoe', 'can'].includes(s.id) || (s && ITEMS[s.id].kind === 'seed')) useItem(); }
    updateFishing(dt);
    zoom = lerp(zoom, S.inside ? 0.82 : 1, Math.min(1, dt * 3));
    focus.set(clamp(P.x, 10, W - 10), 0, clamp(P.z, 8, 58));
    camPos.set(focus.x, CAM_Y * zoom, focus.z + CAM_Z * zoom);
    const k = 1 - Math.exp(-dt * 6); camera.position.lerp(camPos, k); camLook.lerp(focus.clone().setY(0.5), k); camera.lookAt(camLook);
  }
  applyDayLight(focus, dt, tsec);
  updateNPCs(dt, tsec); updateAnimals(dt, tsec); updateNature(dt, tsec, focus, sdir);
  updateAudio(dt, tsec);
  const ripe = S.title ? false : updateTarget();
  if (!S.title) updateHUD(ripe);
  if (nameT > 0) { nameT -= dt; if (nameT <= 0) $('#itemname').style.opacity = 0; }
  if (zoneT > 0) { zoneT -= dt; if (zoneT <= 0) $('#zone').classList.remove('on'); }
  // décor animé
  for (const p of plots.values()) if (p.cropMesh) p.cropMesh.rotation.z = Math.sin(tsec * 1.8 + p.soil.position.x * 0.7 + p.soil.position.z) * 0.035 * WIND.uWind.value;
  for (const s of smokes) { s.t = (s.t + dt * 0.22) % 1; s.m.position.set(s.x + Math.sin(s.t * 5 + s.x) * 0.15 + s.t * 0.5 * WIND.uWind.value, s.y + s.t * 1.6, s.z); s.m.scale.setScalar(0.12 + Math.sin(s.t * Math.PI) * 0.2); }
  boat.position.y = -0.22 + Math.sin(tsec * 1.3) * 0.04; boat.rotation.z = Math.sin(tsec * 1.1) * 0.03;
  beam.rotation.y = tsec * 0.6;
  for (const f of flags) f.g.rotation.y = Math.sin(tsec * 2.2 + f.ph) * 0.3 * (0.4 + WIND.uWind.value * 0.6);
  if (stageObjs.disc) stageObjs.disc.rotation.y += dt * 1.2;
  for (const m of placedMeshes.values()) m.userData.head.rotation.y += dt * 3;
  updateTurtle(dt, tsec);
  const pulse = (AC && AC.state === 'running' && !muted && AU.on) ? AU.pulse : beatFallback(tsec);
  for (const sp of speakers) sp.m.scale.set(sp.sx * (1 + pulse * 0.14), sp.sx * (1 + pulse * 0.14), sp.sz * (1 + pulse * 0.7));
  for (const f of fades) {
    const want = (P.x > f.x0 && P.x < f.x1 && P.z > f.z0 && P.z < f.z1 && !S.title) ? 0.32 : 1;
    if (Math.abs(f.a - want) > 0.005) { f.a = lerp(f.a, want, Math.min(1, dt * 8)); for (const m of f.mats) m.opacity = f.a; }
  }
  if (!bang.hidden) { const [sx, sy] = toScreen(P.x, 1.9, P.z); bang.style.left = sx + 'px'; bang.style.top = sy + 'px'; }
  render();
}

// =====================================================================
// Démarrage
// =====================================================================
resize();
buildWorld(); initNature();
initNodeSpots(); initLocks(); turtle = makeTurtle(); rebuildStakes(); refreshBuildings();
buildPlayer(); buildNPCs(); buildWalk(); placeAllNPCs(); refreshForage();
bobber = new THREE.Group(); part(bobber, G.sph, '#e2362f', [0.08, 0.06, 0.08], [0, 0.03, 0]); part(bobber, G.sph, '#ffffff', [0.075, 0.05, 0.075], [0, -0.02, 0]); bobber.visible = false; scene.add(bobber);
fishLine = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Array(39).fill(0), 3)), new THREE.LineBasicMaterial({ color: '#f6f1e6' }));
fishLine.frustumCulled = false; fishLine.layers.set(1); fishLine.visible = false; scene.add(fishLine);
{
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.beginPath(); x.roundRect(5, 5, 54, 54, 10); x.stroke();
  const t = new THREE.CanvasTexture(c);
  highlight = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.9, depthWrite: false }));
  highlight.rotation.x = -Math.PI / 2; highlight.visible = false; highlight.layers.set(1); highlight.renderOrder = 5; scene.add(highlight);
}
addEventListener('resize', resize);
$('#menu-btn').addEventListener('click', () => { if (!S.title && !S.modal) openMenu(); });
$('#craft-btn').addEventListener('click', () => { if (!S.title && !S.modal) openCraft(); });
$('#test-btn').addEventListener('click', () => { if (!S.title && !S.modal) openMenu('test'); });
renderHotbar();
camera.position.set(30, CAM_Y - 2, 26 + CAM_Z - 1); camLook.set(30, 0, 26); camera.lookAt(camLook);

function startGame(data, slot = 1) {
  cutQueue.length = 0;
  if (data) applySave(data); else { applySave({ plots: [] }); seedFarmDebris(); }
  S.slot = slot; try { localStorage.setItem(LAST_KEY, String(slot)); } catch (e) {}
  S.title = false; $('#title').hidden = true; $('#hud').hidden = false; if (matchMedia('(pointer: coarse)').matches) $('#touch').hidden = false;
  S.zone = zoneOf(P.x, P.z); S.weather = weatherFor(S.day);
  camera.position.set(clamp(P.x, 10, W - 10), CAM_Y, clamp(P.z, 8, 58) + CAM_Z); camLook.set(clamp(P.x, 10, W - 10), 0.5, clamp(P.z, 8, 58));
  renderHotbar(); renderTracker(); canvas.focus(); showZone(S.zone);
  if (!data) { save(); setTimeout(() => cutscene(CUTS.intro, () => toast("Dégage le champ avec la machette et la pioche, puis laboure, sème, arrose. Tante Pearl vend des graines au village, à l'est.", true)), 500); }
  else checkStory();
}
function boot(hot) {
  migrateLegacy(); applySettings(); refreshTitleButtons();
  $('#btn-new').onclick = () => { audio(); openMenu('saves', 'new'); };
  $('#btn-load').onclick = () => { audio(); openMenu('saves', 'load'); };
  if (hot && hot.state) startGame(hot.state, hot.slot || lastSlot() || 1);
  if (location.hash === '#debug') window.IB = { SET, testAction, checkStory, plvl, craft, addItem, nodeAt, cutQueue, readSlot, placeAllNPCs, AU, getAC: () => AC, walk, blocked, boxes, W, H, S, P, ENV, QUALITY, npcs, forage, plots, shellSpots, THREE, camera, scene, startGame, sleepNow, weatherFor, findPath, SPOTS, animalMeshes, openShop, openBook, openBag, openNPC, openAnimals, buyAnimal, toast, spawnAnimalMesh, syncAnimalMeshes, setW: w => { S.weather = w; }, completeQuest, QUESTS };
  requestAnimationFrame(t => { prev = t; loop(t); });
}
window.claude?.hot?.snapshot?.(() => ({ state: S.title ? null : serialize(true), slot: S.slot }));
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
