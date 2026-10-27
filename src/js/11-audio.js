// =====================================================================
// Son : reggae synthétisé (one-drop, skank, basse chaude), ambiance, bruitages
// =====================================================================
let AC = null, muted = false, noiseBuf = null;
const AU = { master: null, sfx: null, music: null, lp: null, rev: null, amb: {}, on: false, next: 0, step: 0, bar: 0, beats: [], pulse: 0, timer: 0, tempo: 76, birdT: 2, cricketT: 1, sources: [[63.5, 24.5, 20], [80, 33, 16], [11, 9, 9]] };
function audio() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); initAudioGraph(); }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
function mkNoise() {
  const b = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b;
}
function loopNoise(type, freq, q = 0.7) {
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = AC.createGain(); g.gain.value = 0; s.connect(f).connect(g).connect(AU.master); s.start();
  return { s, f, g };
}
function initAudioGraph() {
  noiseBuf = mkNoise();
  AU.master = AC.createGain(); AU.master.gain.value = muted ? 0 : 0.9; AU.master.connect(AC.destination);
  AU.sfx = AC.createGain(); AU.sfx.gain.value = SET.sfx; AU.sfx.connect(AU.master);
  AU.music = AC.createGain(); AU.music.gain.value = 0.3;
  AU.lp = AC.createBiquadFilter(); AU.lp.type = 'lowpass'; AU.lp.frequency.value = 3200; AU.lp.Q.value = 0.4;
  AU.music.connect(AU.lp); AU.lp.connect(AU.master);
  // réverbération courte pour le côté dub
  const conv = AC.createConvolver(), len = AC.sampleRate * 1.5, imp = AC.createBuffer(2, len, AC.sampleRate);
  for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  conv.buffer = imp; AU.rev = AC.createGain(); AU.rev.gain.value = 0.28; AU.rev.connect(conv); conv.connect(AU.lp);
  AU.amb.ocean = loopNoise('lowpass', 650); AU.amb.river = loopNoise('bandpass', 900, 0.9); AU.amb.rain = loopNoise('highpass', 1400, 0.5); AU.amb.wind = loopNoise('lowpass', 420);
  // houle : modulation lente du volume de l'océan
  const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.35; lfo.connect(lg); lg.connect(AU.amb.ocean.f.frequency); lfo.start();
  AU.on = true; AU.next = AC.currentTime + 0.2; AU.step = 0; AU.bar = 0;
  AU.timer = setInterval(musicTick, 25);
}
function setMuted(m) { muted = m; SET.mute = m; saveSettings(); if (AU.master) AU.master.gain.setTargetAtTime(m ? 0 : 0.9, AC.currentTime, 0.05); }

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [
  { root: 48, third: 4, notes: [55, 60, 64, 67] },   // Cmaj7
  { root: 45, third: 3, notes: [57, 60, 64, 69] },   // Am7
  { root: 41, third: 4, notes: [57, 60, 65, 69] },   // Fmaj7
  { root: 43, third: 4, notes: [55, 59, 62, 67] },   // G6
];
const PENTA = [72, 74, 76, 79, 81, 84];
function env(g, t, a, d, v) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function voice(type, freq, t, a, d, v, dest, pan = 0, filt = 0) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = freq;
  let node = o; if (filt) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filt; o.connect(f); node = f; }
  node.connect(g); env(g, t, a, d, v);
  let out = g; if (pan && AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  out.connect(dest); if (dest === AU.music) { const s = AC.createGain(); s.gain.value = 0.5; out.connect(s); s.connect(AU.rev); }
  o.start(t); o.stop(t + a + d + 0.05);
}
function drumNoise(t, dur, freq, v, type = 'bandpass', q = 1, send = false) {
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = AC.createGain(); s.connect(f); f.connect(g); env(g, t, 0.002, dur, v); g.connect(AU.music);
  if (send) { const sg = AC.createGain(); sg.gain.value = 0.9; g.connect(sg); sg.connect(AU.rev); }
  s.start(t, Math.random()); s.stop(t + dur + 0.03);
}
function playStep(step, t) {
  const bar = AU.bar % 4, ch = CHORDS[bar], day = ENV.night < 0.6, sd = 60 / AU.tempo / 4;
  const rainy = ENV.rain > 0.3;
  // kick et rim : one-drop (temps 3)
  if (step === 8) {
    const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    o.connect(g); env(g, t, 0.003, 0.22, 0.5); g.connect(AU.music); o.start(t); o.stop(t + 0.3);
    drumNoise(t, 0.07, 1900, 0.16, 'bandpass', 1.2, true); voice('triangle', 390, t, 0.002, 0.07, 0.1, AU.music);
    AU.beats.push(t);
  }
  if (step === 0) AU.beats.push(t);
  // charleston
  if (step % 2 === 0 && (day || step % 4 === 0)) drumNoise(t, step % 4 === 2 ? 0.05 : 0.03, 8000, step % 4 === 2 ? 0.07 : 0.04, 'highpass', 0.7);
  // skank : accords sur les contretemps
  if (step % 4 === 2) for (const n of ch.notes) voice('sawtooth', mtof(n), t, 0.004, 0.12, 0.028, AU.music, 0.3, rainy ? 1300 : 2400);
  // bubble d'orgue
  if (step % 4 === 3) { voice('sine', mtof(ch.notes[0] + 12), t, 0.004, 0.1, 0.045, AU.music, -0.3); voice('sine', mtof(ch.notes[2] + 12), t, 0.004, 0.1, 0.03, AU.music, -0.3); }
  // basse chaude
  const BASS = [[0, 0, 5], [6, 0, 2], [8, 7, 3], [12, ch.third, 2], [14, 7, 2]];
  for (const [s, off, len] of BASS) if (s === step) {
    const f = mtof(ch.root + off), d = len * sd;
    voice('sine', f, t, 0.01, d * 0.95, 0.34, AU.music); voice('triangle', f * 2, t, 0.01, d * 0.6, 0.07, AU.music, 0, 900);
    if (s === 0 || s === 8) AU.beats.push(t);
  }
  // mélodie de steel drum, rare la nuit
  if (step === 0) AU.motif = [0, 3, 6, 10, 12, 14].filter(() => rnd() < (day ? 0.45 : 0.18)).map(s => [s, PENTA[(rnd() * PENTA.length) | 0]]);
  if (AU.motif) for (const [s, n] of AU.motif) if (s === step) { const f = mtof(n); voice('sine', f, t, 0.004, 0.5, 0.05, AU.music, -0.1); voice('sine', f * 2.76, t, 0.003, 0.18, 0.012, AU.music, -0.1); }
}
function musicTick() {
  if (!AC || !AU.on || AC.state !== 'running') return;
  const sd = 60 / AU.tempo / 4;
  if (AU.next < AC.currentTime - 0.4) AU.next = AC.currentTime + 0.05;
  while (AU.next < AC.currentTime + 0.14) {
    try { playStep(AU.step % 16, AU.next); } catch (e) {}
    AU.next += sd; AU.step++; if (AU.step % 16 === 0) AU.bar++;
  }
}
function updateAudio(dt, tsec) {
  if (!AC || !AU.master) return;
  while (AU.beats.length && AU.beats[0] <= AC.currentTime) { AU.pulse = 1; AU.beats.shift(); }
  AU.pulse = Math.max(0, AU.pulse - dt * 4.5);
  const T = AC.currentTime, set = (p, v, tc = 0.4) => p.setTargetAtTime(v, T, tc);
  // musique : plus forte et plus claire près d'un sound system
  let near = 0; for (const [x, z, r] of AU.sources) near = Math.max(near, 1 - Math.hypot(P.x - x, P.z - z) / r);
  near = clamp(near, 0, 1);
  const inH = S.inside ? 0.12 : 0;
  set(AU.music.gain, (0.16 + 0.6 * near + inH) * (S.title ? 1.1 : 1) * SET.music * 1.4, 0.5); set(AU.lp.frequency, 1400 + near * 14000 + (ENV.rain > 0.3 ? 0 : 1200), 0.5);
  // ambiances
  const cz = coastZ(clamp(Math.floor(P.x), 0, W - 1)), dSea = Math.max(0, cz - P.z), dRiv = Math.abs(P.x - riverX(Math.floor(P.z)));
  const A = SET.amb * 1.4;
  set(AU.amb.ocean.g.gain, (Math.pow(clamp(1 - dSea / 24, 0, 1), 1.5) * 0.2 + 0.015) * A);
  set(AU.amb.river.g.gain, clamp(1 - dRiv / 12, 0, 1) * 0.07 * A);
  set(AU.amb.rain.g.gain, ENV.rain * (S.inside ? 0.05 : 0.14) * A);
  set(AU.amb.wind.g.gain, (0.02 + WIND.uWind.value * 0.03 + ENV.storm * 0.05) * A);
  // oiseaux le jour, grillons la nuit
  if (!S.modal && !S.title) {
    AU.birdT -= dt; AU.cricketT -= dt;
    if (AU.birdT <= 0) { AU.birdT = 2 + Math.random() * 5; if (ENV.night < 0.3 && ENV.rain < 0.2 && !muted) { const f = 2400 + Math.random() * 1600; tone(f, f * 1.3, 0.09, 'sine', 0.025); tone(f * 1.2, f * 0.9, 0.08, 'sine', 0.02, 0.12); if (Math.random() < 0.5) tone(f * 1.1, f * 1.4, 0.07, 'sine', 0.02, 0.26); } }
    if (AU.cricketT <= 0) { AU.cricketT = 0.12; if (ENV.night > 0.55 && ENV.rain < 0.3) { tone(4300, 4300, 0.05, 'sine', 0.006); tone(4300, 4300, 0.05, 'sine', 0.006, 0.07); } }
  }
}
function tone(f0, f1, dur, type = 'sine', vol = 0.15, delay = 0) {
  if (!AC || muted || !AU.sfx) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(AU.sfx); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, freq, vol = 0.2, delay = 0, type = 'bandpass') {
  if (!AC || muted || !noiseBuf) return;
  const t = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = 0.8;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f).connect(g).connect(AU.sfx); s.start(t, Math.random()); s.stop(t + dur);
}
const SFX = {
  hoe: () => { tone(150, 60, 0.12, 'triangle', 0.25); noise(0.1, 500, 0.18); }, thud: () => tone(110, 70, 0.08, 'triangle', 0.12),
  water: () => noise(0.35, 1800, 0.1), splash: () => noise(0.28, 900, 0.22), plant: () => tone(500, 900, 0.08, 'sine', 0.12),
  harvest: () => { tone(520, 780, 0.08, 'square', 0.05); tone(780, 1170, 0.1, 'square', 0.05, 0.07); },
  coin: () => { tone(988, 988, 0.07, 'square', 0.05); tone(1318, 1318, 0.14, 'square', 0.05, 0.07); },
  bite: () => tone(1200, 1500, 0.09, 'square', 0.07), cast: () => noise(0.18, 2500, 0.07),
  catch: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.12, i * 0.07)),
  lose: () => tone(400, 180, 0.3, 'triangle', 0.1), eat: () => { tone(300, 200, 0.07, 'square', 0.05); tone(300, 220, 0.07, 'square', 0.05, 0.1); },
  sel: () => tone(880, 880, 0.03, 'sine', 0.035),
  level: () => [392, 494, 587, 784, 988].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.1, i * 0.08)),
  quest: () => { [523, 659, 784].forEach((f, i) => tone(f, f, 0.14, 'square', 0.05, i * 0.09)); tone(1046, 1046, 0.35, 'triangle', 0.09, 0.3); },
  cluck: () => { tone(700, 1100, 0.05, 'square', 0.03); tone(800, 1250, 0.05, 'square', 0.03, 0.08); tone(750, 600, 0.07, 'square', 0.03, 0.16); },
  moo: () => { tone(170, 120, 0.7, 'sawtooth', 0.045); tone(340, 240, 0.7, 'triangle', 0.02); },
  thunder: () => { noise(2.2, 120, 0.5, 0, 'lowpass'); noise(1.1, 300, 0.25, 0.1, 'lowpass'); tone(60, 30, 1.2, 'sine', 0.2); },
};
const sfx = k => { try { SFX[k] && SFX[k](); } catch (e) {} };
