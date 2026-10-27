// =====================================================================
// La légende de RastaBabylone : chapitres, éclats, Inspecteur, tortue
// =====================================================================
const LORE = [
  "Il y a très longtemps, RastaBabylone, une tortue géante, nageait autour d'Irie Bay avec le Grand Sound System sur le dos. Sa basse était si profonde que les noix de coco tombaient vers le haut et que les cultures poussaient en une nuit.",
  "Puis le Ministère des Formulaires débarqua, en costume gris. Il déclara la basse « non conforme », confisqua le Vinyle d'Or et le brisa en sept éclats qu'il sema aux quatre coins de l'île. La tortue, vexée, alla bouder au fond de la baie. Elle y dort encore.",
  "Une comptine dit où chercher : « Un dans la terre, un dans la mer, un au comptoir, un dans un nid, un au bout de la jetée, un dans la poche d'un gamin, et le dernier tout là-haut. »",
  "Le Ministère existe toujours. Son dernier inspecteur arrive par le bateau du mardi. On dit qu'il a un cœur, rangé quelque part dans un classeur.",
  "Quand les sept éclats seront réunis, il faudra poser le Vinyle d'Or sur la platine de la place, une nuit sans orage, et monter le son.",
];
const CHAPTERS = [null,
  { title: "L'héritage de Tonton Dub", goal: 'Récolte 3 légumes et rencontre 3 villageois.', lore: 1,
    prog: () => [Math.min(3, stat('harvested')) + Math.min(3, metCount()), 6] },
  { title: 'Les Éclats du Vinyle', goal: "Retrouve 3 éclats du Vinyle d'Or. Le poulailler peut maintenant être construit.", lore: 3,
    prog: () => [Math.min(3, S.story.frags.length), 3] },
  { title: 'Le Ministère des Formulaires', goal: "Remplis les 3 formulaires de l'Inspecteur Babylone (sur la place, 10h-16h).", lore: 4,
    prog: () => [S.story.forms, 3] },
  { title: 'Le Grand Réveil', goal: "Réunis les 7 éclats, puis pose le Vinyle d'Or sur la platine de la place, la nuit.", lore: 5,
    prog: () => [S.story.frags.length, 7] },
  { title: 'Épilogue : bonnes ondes', goal: 'RastaBabylone veille sur la baie. Tes ventes rapportent 10 % de plus. Le reste, c\'est du bonus.', lore: 5,
    prog: () => [1, 1] },
];
const FRAGS = [
  { id: 'f1', name: 'Éclat des Racines', hint: 'Dans la terre : dégage 12 débris de ton yard.', ok: () => stat('debris') >= 12,
    cut: [['Narrateur', "Ta lame fait « tiiing » contre quelque chose de dur. Entre deux racines dépasse un morceau de vinyle doré. L'Éclat des Racines !"]] },
  { id: 'f2', name: 'Éclat des Marées', hint: 'Dans la mer : pêche 8 poissons, Winston a quelque chose pour toi.', ok: () => stat('caught') >= 8,
    cut: [['Capitaine Winston', "Tiens, regarde ce que j'ai trouvé dans le ventre d'un mérou, l'an dernier. Ça brille comme toi quand tu ramènes un poisson. Garde-le."]] },
  { id: 'f3', name: 'Éclat du Comptoir', hint: 'Au comptoir : deviens ami avec Zion (4 cœurs).', ok: () => hearts('zion') >= 4,
    cut: [['Zion', "Ce truc ? Je m'en servais comme dessous de verre depuis dix ans. Si c'est un morceau de légende, il est à toi, bredda. Respect."]] },
  { id: 'f4', name: 'Éclat du Nid', hint: 'Dans un nid : construis le poulailler et ramasse un œuf doré.', ok: () => stat('golden_eggs') >= 1,
    cut: [['Narrateur', "Sous l'œuf doré, au fond du nid, il y a un éclat tout chaud. La poule a l'air très fière d'elle. Elle ne dira pas d'où il vient."]] },
  { id: 'f5', name: 'Éclat de la Jetée', hint: 'Au bout de la jetée : répare les planches pourries.', ok: () => S.unlocked.pier,
    cut: [['Narrateur', "En posant la dernière planche neuve, tu vois briller quelque chose entre deux poteaux. L'Éclat de la Jetée t'attendait depuis trois siècles."]] },
  { id: 'f6', name: 'Éclat du Gamin', hint: "Dans la poche d'un gamin : 3 cœurs avec Delroy.", ok: () => hearts('delroy') >= 3,
    cut: [['Delroy', "Mon coquillage brillant ? Bon... d'accord, c'est toi. Mais tu me laisses le regarder de temps en temps, promis ?"]] },
  { id: 'f7', name: 'Éclat du Phare', hint: 'Tout là-haut : monte en haut du phare (il faut un permis).', ok: () => S.story.flags.lighthouseTop,
    cut: [['Narrateur', "Tout en haut du phare, posé sur la lentille, le dernier éclat t'attendait. D'ici, on voit toute la baie... et une énorme ombre qui ronfle sous l'eau."]] },
];
const CUTS = {
  intro: [
    ['Lettre de Tonton Dub', "Salut toi ! Si tu lis ça, c'est que je suis parti en tournée cosmique. Le yard est à toi : une case, un champ plein de broussailles et une machette qui coupe à peu près."],
    ['Lettre de Tonton Dub', "Ici, on raconte la légende de RastaBabylone, une tortue géante qui portait le Grand Sound System sur son dos. Sa basse faisait tomber les noix de coco vers le haut."],
    ['Lettre de Tonton Dub', "Un jour, le Ministère des Formulaires a déclaré la basse « non conforme ». Ils ont brisé le Vinyle d'Or en sept éclats. Depuis, la tortue boude au fond de la baie."],
    ['Lettre de Tonton Dub', "Je compte sur toi. Dégage le champ, plante des trucs, fais-toi des amis. Et si tu trouves un éclat qui brille, tu sauras quoi faire. Respect. PS : ne signe RIEN de gris."],
  ],
  ch2: [
    ['Mama Ivy', "Alors c'est toi qui as repris le yard de Dub ! Il t'a parlé de RastaBabylone, j'imagine. Ce vieux fou a passé sa vie à chercher ces éclats."],
    ['Mama Ivy', "Ma grand-mère chantait : « Un dans la terre, un dans la mer, un au comptoir, un dans un nid, un au bout de la jetée, un dans la poche d'un gamin, et le dernier tout là-haut. »"],
    ['Mama Ivy', "Et construis-toi un poulailler, va. Une ferme sans poules, c'est comme un sound system sans basse."],
  ],
  ch3: [
    ['Inspecteur Babylone', "Bonjour. Inspecteur Babylone, Ministère des Formulaires, service des Vibrations Non Autorisées. On me signale une recrudescence de bonne humeur sur cette île."],
    ['Inspecteur Babylone', "Vos recherches d'éclats nécessitent trois formulaires. En triple exemplaire. À l'encre grise. Je serai sur la place de 10h à 16h, sauf quand je n'y suis pas."],
    ['Zion', "(tout bas) Fais-lui ses papiers, bredda. Il a la clé du phare. Et je l'ai déjà vu taper du pied en rythme, quand il croit que personne ne regarde."],
  ],
  permis: [
    ['Inspecteur Babylone', "Formulaire Z-0 reçu, tamponné, re-tamponné. Voici votre permis de visite du phare. Ce gâteau était... conforme. Très conforme."],
    ['Inspecteur Babylone', "(il esquisse un pas de danse, puis se fige) Je n'ai rien fait. Circulez."],
  ],
  ch4: [
    ['Capitaine Winston', "Tu y es presque, hein ? Quand tu auras les sept éclats, pose le Vinyle d'Or sur la grande platine de la place, une nuit sans orage. Et tiens bien ton chapeau."],
  ],
  finale: [
    ['Narrateur', "Tu poses le Vinyle d'Or sur la grande platine. Les enceintes toussent, crachotent... puis la première note de basse fait trembler tous les cocotiers de l'île."],
    ['Narrateur', "Au loin, la mer se bombe. Une carapace couverte de palmiers sort lentement de l'eau. RastaBabylone ouvre un œil, puis l'autre, et bâille en mi bémol."],
    ['RastaBabylone', "Mmmh... quelle sieste. Trois cents ans ? Pfff. Bon. Qui a mis ce morceau ? Excellent choix."],
    ['Inspecteur Babylone', "Ceci est hautement irrégulier. Je vais devoir... je vais devoir... (il retire sa cravate) ...je vais devoir danser."],
    ['RastaBabylone', "Merci, petit fermier. Tant que la musique jouera, l'île aura de bonnes ondes, et les marchands seront de bonne humeur : tes ventes rapportent 10 % de plus. Irie !"],
  ],
};

// Inspecteur Babylone : un villageois de plus, en costume gris
NPC_DEFS.push({ id: 'inspecteur', name: 'Inspecteur Babylone', scale: 1.02,
  look: { skin: '#e6c3a0', hair: '#3a3a3a', hairStyle: 'short', hat: 'melon', glasses: 'round', shirt: '#7b8494', pants: '#5b6270', tie: '#8a1f2a' },
  sched: [[360, 'insp_home'], [600, 'plaza_d'], [960, 'insp_home']],
  loves: ['gateau_coco', 'planche'], likes: ['corde', 'pierre', 'jus_coco', 'jus_ananas'], hates: ['ganja', 'piment'],
  lines: {
    low: ["Votre chapeau n'est pas au format A4. Je le note.", "Saviez-vous que sourire sans autorisation est passible d'une amende de trois tampons ?"],
    mid: ["Hmf. Votre champ est... aligné. J'apprécie l'alignement.", "Le formulaire, c'est la paix intérieure. Avec des cases."],
    high: ["Entre nous... cette musique, là. Elle n'est pas si non conforme.", "Si vous voyez Zion, ne lui dites pas que je connais toutes les paroles."] },
  rain: ["La pluie mouille les formulaires. C'est un drame administratif."] });
NPC_BY_ID.inspecteur = NPC_DEFS[NPC_DEFS.length - 1];
SPOTS.insp_home = [63.5, 45.6]; SPOTS.plaza_d = [63.5, 29.7];
QUESTS.push(
  { id: 'formA', title: 'Formulaire A-38', desc: "« Attestation de non-vibration » : livre 5 planches à l'Inspecteur Babylone.", deliver: ['inspecteur', 'planche', 5], gold: 150, friend: 30, req: () => S.story.ch >= 3, story: true },
  { id: 'formB', title: 'Formulaire B-52', desc: "« Déclaration de noix conforme » : livre 6 noix de coco à l'Inspecteur.", deliver: ['inspecteur', 'coco', 6], gold: 200, friend: 30, req: () => S.done.includes('formA'), story: true },
  { id: 'formC', title: 'Formulaire Z-0', desc: "« Certificat de calme absolu » : livre 1 gâteau coco (œuf, lait, coco) à l'Inspecteur.", deliver: ['inspecteur', 'gateau_coco', 1], gold: 400, friend: 60, req: () => S.done.includes('formB'), story: true },
);
const metCount = () => Object.values(S.friends).filter(f => f.met).length;
const hasFrag = fid => S.story.frags.includes(fid);

// File de scènes : une scène attend si une fenêtre est déjà ouverte
const cutQueue = [];
function cutscene(lines, onEnd) { cutQueue.push({ lines, onEnd }); if (!S.modal && !S.title) nextCut(); }
function nextCut() { const c = cutQueue.shift(); if (!c) return; openModal('cut', { cut: c, idx: 0 }); }
function onQuestDone(q) {
  if (!q.id.startsWith('form')) return;
  S.story.forms = ['formA', 'formB', 'formC'].filter(x => S.done.includes(x)).length;
  if (q.id === 'formC') { S.story.flags.permis = true; cutscene(CUTS.permis); toast('Tu as le permis du phare : la porte peut être ouverte.', true); }
  checkStory();
}
let storyLock = false;
function checkStory() {
  if (storyLock || S.title) return; storyLock = true;
  const st = S.story;
  if (st.ch === 1 && stat('harvested') >= 3 && metCount() >= 3) { st.ch = 2; cutscene(CUTS.ch2); toast("Chapitre 2 : les Éclats du Vinyle. Le poulailler peut être construit.", true); }
  if (st.ch >= 2) for (const f of FRAGS) if (!hasFrag(f.id) && f.ok()) {
    st.frags.push(f.id); cutscene(f.cut); toast(`Éclat trouvé : ${f.name} (${st.frags.length}/7)`, true); sfx('level'); xpGain('forage', 30);
  }
  if (st.ch === 2 && st.frags.length >= 3) { st.ch = 3; cutscene(CUTS.ch3); toast("Chapitre 3 : le Ministère des Formulaires.", true); }
  if (st.ch === 3 && st.flags.permis) { st.ch = 4; cutscene(CUTS.ch4); toast('Chapitre 4 : le Grand Réveil.', true); }
  storyLock = false; renderTracker();
}
function storyObjective() {
  const c = CHAPTERS[S.story.ch]; if (!c || S.story.flags.awake) return null;
  const [a, b] = c.prog(); return { title: `Chapitre ${S.story.ch} · ${c.title}`, desc: c.goal, a, b };
}

// Le phare et le grand final
function climbLighthouse() {
  if (S.story.flags.lighthouseTop) { toast('La vue est toujours aussi belle. La grosse ombre ronfle toujours.'); return; }
  S.story.flags.lighthouseTop = true; sfx('quest'); checkStory();
}
let turtle = null, turtleRise = 0;
function makeTurtle() {
  const g = new THREE.Group(); g.position.set(74, -4, 57.2); scene.add(g);
  part(g, G.ico, '#2f8a3c', [4.2, 1.5, 3.3], [0, 0, 0]);
  for (const [x, z, s] of [[0, 0, 1.3], [1.9, 0.6, 0.9], [-1.9, 0.5, 0.9], [1.2, -1.6, 0.8], [-1.2, -1.6, 0.8], [0.4, 1.9, 0.8], [-0.6, 1.9, 0.7]]) part(g, G.ico0, '#3f9d57', [s, 0.35, s], [x, 1.2, z]);
  part(g, G.cyl, '#c9a45a', [4.1, 0.25, 3.2], [0, -0.1, 0]);
  const head = part(g, G.sph, '#7fbf5a', [1.1, 0.9, 1.2], [0, 0.3, -3.7]);
  for (const s of [-1, 1]) { part(g, G.sph, '#ffffff', [0.22, 0.25, 0.1], [s * 0.45, 0.65, -4.7]); part(g, G.sph, '#241a2e', [0.1, 0.12, 0.05], [s * 0.45, 0.65, -4.78]); }
  for (const [x, z, r] of [[2.8, -1.6, 0.6], [-2.8, -1.6, -0.6], [2.6, 1.8, -0.5], [-2.6, 1.8, 0.5]]) part(g, G.sph, '#7fbf5a', [1.3, 0.2, 0.6], [x, -0.2, z], [0, r, 0]);
  part(g, G.cyl, '#fbe7a8', [1.8, 0.4, 1.8], [0, 1.55, 0.2]);
  for (const [x, z, h] of [[-0.7, 0.4, 2.6], [0.8, -0.2, 2.1]]) {
    part(g, G.cyl6, '#a8774e', [0.1, h, 0.1], [x, 1.6 + h / 2, z]);
    for (let k = 0; k < 6; k++) part(g, G.sph, '#34a844', [0.9, 0.06, 0.25], [x + Math.cos(k * 1.05) * 0.7, 1.6 + h, z + Math.sin(k * 1.05) * 0.7], [0, -k * 1.05, -0.3]);
  }
  for (const s of [-1, 1]) { part(g, G.box, '#1d1a24', [0.6, 0.9, 0.5], [s * 1.0, 2.2, 0.9]); part(g, G.cyl, '#e2362f', [0.18, 0.04, 0.18], [s * 1.0, 2.25, 1.16], [Math.PI / 2, 0, 0]); }
  g.visible = false; g.userData.head = head; return g;
}
function finale() {
  if (S.story.flags.awake) { toast('RastaBabylone fait la sieste, le ventre au soleil.'); return; }
  if (!(S.time >= 1200 || S.time < 300)) { toast('Attends la nuit pour poser le Vinyle d\'Or (après 20h).'); return; }
  if (S.weather === 'storm') { toast("Pas sous l'orage : le vinyle a horreur de l'eau."); return; }
  cutscene(CUTS.finale, () => {
    S.story.flags.awake = true; S.story.ch = 5; turtle.visible = true; turtleRise = 0.001; AU.tempo = 84;
    addGold(3000, false); toast("RastaBabylone est réveillée ! +3000 g et +10 % sur toutes tes ventes.", true); sfx('quest'); save(); renderTracker();
  });
}
function updateTurtle(dt, tsec) {
  if (!turtle) return;
  turtle.visible = !!S.story.flags.awake;
  if (!turtle.visible) return;
  if (turtleRise > 0 && turtleRise < 1) turtleRise = Math.min(1, turtleRise + dt / 7);
  const base = turtleRise > 0 && turtleRise < 1 ? lerp(-4, -0.4, turtleRise * turtleRise * (3 - 2 * turtleRise)) : -0.4;
  turtle.position.y = base + Math.sin(tsec * 0.6) * 0.12;
  turtle.rotation.z = Math.sin(tsec * 0.4) * 0.02;
  turtle.userData.head.position.y = 0.3 + Math.sin(tsec * 1.3) * 0.08;
}
