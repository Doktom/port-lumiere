import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const wait = ms => new Promise(r => setTimeout(r, ms));
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
function hash2(x, y) { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
let seedV = 20261027;
const rnd = () => ((seedV = (seedV * 16807) % 2147483647) - 1) / 2147483646;
const rr = (a, b) => a + rnd() * (b - a);
const pick = arr => arr[(rnd() * arr.length) | 0];
const dayRand = (d, k) => hash2(d * 12.9898 + k * 78.233, k * 3.1 + d * 0.7);

try { await Promise.race([document.fonts.load('48px "Lilita One"'), wait(1500)]); } catch (e) {}

// =====================================================================
// Données de jeu
// =====================================================================
const MIN_SEC = 0.6;              // 1 minute de jeu = 0,6 s
const INV_SIZE = 30;
const SEASONS = ['Brise', 'Soleil', 'Pluies', 'Alizés'];
const SEASON_DESC = ['Fleurs partout, la terre est douce.', 'Chaleur et grand ciel bleu.', 'Averses, orages et cultures qui boivent.', 'Vent frais et mer agitée.'];
const WEEK = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];
const WX_NAMES = { sun: 'Grand soleil', cloud: 'Nuageux', rain: 'Pluie', storm: 'Orage' };
const WX_PROBS = [[0.62, 0.2, 0.16, 0.02], [0.76, 0.14, 0.08, 0.02], [0.24, 0.2, 0.4, 0.16], [0.5, 0.3, 0.15, 0.05]];
const seasonOf = day => Math.floor((day - 1) / 28) % 4;
const dom = day => (day - 1) % 28 + 1;
function weatherFor(day) {
  if (day <= 2) return 'sun';
  const p = WX_PROBS[seasonOf(day)], r = dayRand(day, 3.7);
  let a = 0; const keys = ['sun', 'cloud', 'rain', 'storm'];
  for (let k = 0; k < 4; k++) { a += p[k]; if (r < a) return keys[k]; }
  return 'sun';
}
const wet = w => w === 'rain' || w === 'storm';
const rainbowFor = day => weatherFor(day) === 'sun' && day > 1 && wet(weatherFor(day - 1));

const TOOL_NAMES = {
  hoe: ['Houe', 'Houe en fer', 'Houe dorée'],
  can: ['Arrosoir', 'Arrosoir en fer', 'Arrosoir doré'],
  rod: ['Canne en bambou', 'Canne en fibre', 'Canne dorée'],
};
const TOOL_HINT = {
  hoe: ['Laboure la case visée', 'Laboure 3 cases en ligne', 'Laboure 5 cases en ligne'],
  can: ['Arrosoir de 40 litres, 1 case', 'Arrosoir de 80 litres, 3 cases en ligne', 'Arrosoir de 160 litres, 5 cases en ligne'],
  rod: ['Barre de prise standard', 'Barre de prise plus large, touche plus vite', 'Grande barre, poissons rares plus fréquents'],
};
const UPGRADE_COST = [0, 400, 1500];
const tierLine = t => [1, 3, 5][t];
const canMax = t => [40, 80, 160][t];

const ITEMS = {
  hoe: { name: 'Houe', kind: 'tool' }, can: { name: 'Arrosoir', kind: 'tool' }, rod: { name: 'Canne', kind: 'tool' },
  s_gombo: { name: 'Graines de gombo', kind: 'seed', crop: 'gombo', buy: 20 },
  s_patate: { name: 'Graines de patate douce', kind: 'seed', crop: 'patate', buy: 30 },
  s_tomate: { name: 'Graines de tomate', kind: 'seed', crop: 'tomate', buy: 40 },
  s_piment: { name: 'Graines de piment', kind: 'seed', crop: 'piment', buy: 45 },
  s_giraumon: { name: 'Graines de giraumon', kind: 'seed', crop: 'giraumon', buy: 100 },
  s_ananas: { name: 'Plants d\'ananas', kind: 'seed', crop: 'ananas', buy: 120 },
  s_ganja: { name: 'Graines de ganja', kind: 'seed', crop: 'ganja', buy: 150 },
  gombo: { name: 'Gombo', kind: 'crop', sell: 45, food: 12 },
  patate: { name: 'Patate douce', kind: 'crop', sell: 80, food: 22 },
  tomate: { name: 'Tomate', kind: 'crop', sell: 50, food: 15 },
  piment: { name: 'Piment antillais', kind: 'crop', sell: 60, food: 8 },
  giraumon: { name: 'Giraumon', kind: 'crop', sell: 340, food: 45 },
  ananas: { name: 'Ananas', kind: 'crop', sell: 240, food: 40 },
  ganja: { name: 'Ganja', kind: 'herb', sell: 320 },
  tilapia: { name: 'Tilapia', kind: 'fish', sell: 28, diff: 18, color: '#9fb7a2', cm: [12, 28] },
  mulet: { name: 'Mulet', kind: 'fish', sell: 65, diff: 40, color: '#c3ccd4', cm: [25, 45] },
  janga: { name: 'Janga', kind: 'fish', sell: 90, diff: 52, color: '#e0583b', cm: [8, 18] },
  anguille: { name: 'Anguille', kind: 'fish', sell: 120, diff: 60, color: '#5d5b86', cm: [40, 80] },
  vivaneau: { name: 'Vivaneau', kind: 'fish', sell: 35, diff: 20, color: '#ee6a52', cm: [20, 45] },
  perroquet: { name: 'Poisson-perroquet', kind: 'fish', sell: 85, diff: 44, color: '#2fb6a7', cm: [25, 50] },
  mahi: { name: 'Mahi-mahi', kind: 'fish', sell: 150, diff: 62, color: '#f2c83a', cm: [60, 120] },
  marlin: { name: 'Marlin', kind: 'fish', sell: 420, diff: 88, color: '#3a5fa8', cm: [150, 300] },
  oeuf: { name: 'Œuf', kind: 'product', sell: 55, food: 10 },
  oeuf_or: { name: 'Œuf doré', kind: 'product', sell: 140, food: 20 },
  lait: { name: 'Lait', kind: 'product', sell: 150, food: 25 },
  lait_creme: { name: 'Lait crémeux', kind: 'product', sell: 320, food: 40 },
  coco: { name: 'Noix de coco', kind: 'forage', sell: 35, food: 25 },
  coquillage: { name: 'Coquillage', kind: 'forage', sell: 45 },
  jus_coco: { name: 'Jus de coco', kind: 'food', buy: 40, sell: 20, food: 35 },
  plantain: { name: 'Plantain frit', kind: 'food', buy: 70, sell: 35, food: 55 },
  jerk: { name: 'Poulet jerk', kind: 'food', buy: 160, sell: 80, food: 100 },
  fourrage: { name: 'Fourrage', kind: 'feed', buy: 10, sell: 5 },
};
for (const id in ITEMS) ITEMS[id].id = id;

const CROPS = {
  gombo: { days: 3, seasons: [0, 1], item: 'gombo', lvl: 1 },
  patate: { days: 5, seasons: [0, 2, 3], item: 'patate', lvl: 1 },
  tomate: { days: 7, regrow: 3, seasons: [0, 3], item: 'tomate', lvl: 1 },
  piment: { days: 6, regrow: 3, seasons: [1, 2], item: 'piment', lvl: 1 },
  giraumon: { days: 10, seasons: [2, 3], item: 'giraumon', lvl: 2 },
  ananas: { days: 9, seasons: [1], item: 'ananas', lvl: 2 },
  ganja: { days: 8, seasons: [0, 1], item: 'ganja', lvl: 3 },
};
const FISH_TABLE = {
  river: [['tilapia', 50], ['mulet', 30], ['janga', 12], ['anguille', 12, 'night']],
  sea: [['vivaneau', 45], ['perroquet', 30], ['mahi', 14], ['marlin', 6, 'pier']],
};

// Garde-robe
const COSM = {
  hat_none: { slot: 'hat', name: 'Tête nue', price: 0 },
  hat_straw: { slot: 'hat', name: 'Chapeau de paille', price: 0 },
  hat_cap: { slot: 'hat', name: 'Casquette marine', price: 150 },
  hat_bandana: { slot: 'hat', name: 'Bandana rouge', price: 120 },
  hat_tam: { slot: 'hat', name: 'Tam rasta', price: 250 },
  hat_crown: { slot: 'hat', name: 'Couronne de fleurs', price: 180 },
  shirt_tank: { slot: 'shirt', name: 'Débardeur soleil', price: 0 },
  shirt_white: { slot: 'shirt', name: 'T-shirt blanc', price: 100 },
  shirt_flower: { slot: 'shirt', name: 'Chemise fleurie', price: 220 },
  shirt_surf: { slot: 'shirt', name: 'Maillot de surf', price: 200 },
  shirt_rasta: { slot: 'shirt', name: 'Maillot rasta', price: 300 },
  gl_none: { slot: 'gl', name: 'Sans lunettes', price: 0 },
  gl_round: { slot: 'gl', name: 'Lunettes rondes', price: 160 },
  gl_aviator: { slot: 'gl', name: 'Lunettes aviateur', price: 200 },
};
const SLOT_NAMES = { hat: 'Chapeaux', shirt: 'Hauts', gl: 'Lunettes' };

const SHOPS = {
  graines: { name: 'Graines Irie', keeper: 'Tante Pearl', npc: 'pearl', open: 540, close: 1080, buys: ['crop'],
    hello: "Irie ! Du gombo en trois jours, c'est le départ idéal. Et arrose chaque matin, la terre n'est pas magicienne." },
  poisson: { name: 'Poissonnerie du Port', keeper: 'Capitaine Winston', npc: 'winston', open: 480, close: 1080, buys: ['fish'],
    hello: "Le marlin ne mord qu'au bout de la jetée. L'anguille sort la nuit, dans la rivière. Et ma quincaillerie améliore tes outils." },
  cafe: { name: 'Chez Zion', keeper: 'Zion', npc: 'zion', open: 600, close: 1380, buys: ['herb', 'forage', 'product'],
    hello: "Bienvenue au Beach Bar ! Jus de coco glacé, plantain frit, jerk du jour. Et je rachète les bonnes herbes, les œufs, le lait et les trouvailles de plage." },
  boutique: { name: 'Dread & Style', keeper: 'Desta', npc: 'desta', open: 600, close: 1140, buys: [],
    hello: "Du style, mon cœur ! Ici, on ne s'habille pas, on se met en couleurs. Regarde mes nouveautés." },
};

// Villageois : horaires (minute, lieu), goûts, répliques
const NPC_DEFS = [
  { id: 'pearl', name: 'Tante Pearl', shop: 'graines', scale: 1,
    look: { skin: '#6b3f2a', hair: '#1c1410', hairStyle: 'none', hat: 'wrap', shirt: '#f6c026', pants: '#2fa84f', apron: '#e2362f', skirt: '#2fa84f' },
    sched: [[360, 'pearl_home'], [525, 'pearl_counter'], [1080, 'plaza_a'], [1170, 'cafe_a'], [1290, 'pearl_home']],
    loves: ['ananas', 'giraumon', 'jus_coco'], likes: ['gombo', 'patate', 'piment', 'tomate', 'coco'], hates: ['anguille', 'fourrage'],
    lines: {
      low: ["Tu es la nouvelle du vieux yaad ? Il avait besoin d'amour, cette ferme.", "Les graines ne se plantent pas toutes seules, mon enfant. Allez, au boulot !"],
      mid: ["Ça pousse bien chez toi ? J'ai vu ta fumée de cheminée ce matin, irie.", "Un conseil : le giraumon adore les pluies. Plante-le à l'automne."],
      high: ["Toi, tu es de la famille maintenant. Viens manger un dimanche !", "Je te garde les meilleures graines sous le comptoir, chut."] },
    rain: ["Cette pluie... les cultures sont contentes, moi je reste au sec."] },
  { id: 'winston', name: 'Capitaine Winston', shop: 'poisson', scale: 1.02,
    look: { skin: '#7a4a30', hair: '#e8e2d6', hairStyle: 'short', beard: true, hat: 'cap', shirt: '#fbf6ec', pants: '#2b3f6b', apron: '#17a9c7' },
    sched: [[360, 'winston_home'], [465, 'winston_counter'], [1080, 'pier_end'], [1200, 'cafe_b'], [1320, 'winston_home']],
    loves: ['marlin', 'mahi', 'jerk'], likes: ['vivaneau', 'perroquet', 'tilapia', 'mulet', 'janga'], hates: ['ganja', 'oeuf'],
    lines: {
      low: ["Un jour, j'ai pêché un poisson plus gros que mon bateau. Personne ne me croit.", "La mer, ça ne se commande pas. Ça s'écoute."],
      mid: ["Au bout de la jetée, c'est là que ça mord gros. Prends de la patience et un bon pull.", "Ta canne est correcte. Avec un bon renfort, tu iras plus loin."],
      high: ["Tu pêches comme un vrai marin. Mon bateau, il aimerait t'avoir à bord un jour.", "Pour toi, prix d'ami sur les poissons. Ne le dis à personne !"] },
    rain: ["Pluie ou pas pluie, le poisson mord. C'est moi qui pars me mettre à l'abri."] },
  { id: 'zion', name: 'Zion', shop: 'cafe', scale: 1.03,
    look: { skin: '#5a3425', hair: '#120c0a', hairStyle: 'dreads', hat: 'tam', shirt: '#f6c026', pants: '#e2362f', shorts: true },
    sched: [[360, 'zion_home'], [585, 'zion_counter'], [1380, 'zion_home']],
    loves: ['ganja', 'ananas', 'jerk'], likes: ['coco', 'plantain', 'jus_coco', 'piment', 'mangue'], hates: ['fourrage'],
    lines: {
      low: ["Bienvenue, bredda. Ici, on prend le temps. Le temps, il reviendra.", "Tu veux de la musique ? Elle joue toute seule, c'est la maison qui chante."],
      mid: ["Le secret d'une bonne journée : un jus de coco, un peu de basse, et rien à prouver.", "Ta récolte sent bon jusqu'ici. Respect."],
      high: ["Tu es de la famille du rythme maintenant. Le Beach Bar est aussi chez toi.", "Ce soir, jam à la plage. Amène ton bon esprit, c'est tout."] },
    rain: ["La pluie sur le toit de tôle, c'est la meilleure percussion du monde."] },
  { id: 'desta', name: 'Desta', shop: 'boutique', scale: 1,
    look: { skin: '#8a5a3a', hair: '#1c1410', hairStyle: 'afro', glasses: 'round', shirt: '#ff7ac8', pants: '#17a9c7', skirt: '#17a9c7' },
    sched: [[360, 'desta_home'], [585, 'desta_counter'], [1140, 'plaza_c'], [1230, 'cafe_a'], [1320, 'desta_home']],
    loves: ['coquillage', 'ananas', 'jus_coco'], likes: ['ganja', 'oeuf_or', 'lait_creme', 'plantain'], hates: ['anguille', 'janga'],
    lines: {
      low: ["Tu portes ça pour travailler ? Ma chérie... mon chéri... on va arranger ça.", "La mode, c'est comme la mer : ça revient toujours, en plus joli."],
      mid: ["Un tam rasta sur ces cheveux, mmh, il te manque juste ça.", "J'ai du nouveau en rayon chaque saison. Passe me voir."],
      high: ["Tu as du style naturel, tu sais ? Tu me donnes des idées.", "Pour toi, je garde la plus belle pièce sous clé."] },
    rain: ["La pluie ? Parfait pour se faire de nouveaux ensembles imperméables."] },
  { id: 'delroy', name: 'Delroy', scale: 0.8,
    look: { skin: '#7b4a30', hair: '#1c1410', hairStyle: 'short', shirt: '#e2362f', pants: '#2b3f6b', shorts: true },
    sched: [[360, 'ivy_home'], [600, 'beach_a'], [780, 'plaza_b'], [900, 'river_a'], [1080, 'pier_a'], [1200, 'ivy_home']],
    loves: ['mahi', 'jus_coco', 'coquillage'], likes: ['coco', 'tilapia', 'vivaneau', 'plantain'], hates: ['gombo', 'tomate'],
    lines: {
      low: ["T'as vu les crabes ? Ils courent de côté. De CÔTÉ !", "Un jour je pêcherai un marlin, je te le jure."],
      mid: ["Je connais une cachette à coquillages sur la plage, mais c'est secret.", "Ma mamie dit que la pluie c'est bon pour grandir."],
      high: ["T'es mon meilleur ami ici. Même meilleur que les crabes.", "Viens, on fait la course jusqu'au phare !"] },
    rain: ["Mamie veut que je reste à la maison. C'est nul."] },
  { id: 'ivy', name: 'Mama Ivy', scale: 0.96,
    look: { skin: '#9a6a4a', hair: '#e6e1e8', hairStyle: 'bun', shirt: '#8a4fd6', pants: '#8a4fd6', skirt: '#8a4fd6' },
    sched: [[360, 'ivy_home'], [540, 'plaza_a'], [720, 'market'], [900, 'beach_b'], [1080, 'cafe_b'], [1230, 'ivy_home']],
    loves: ['giraumon', 'patate', 'lait_creme'], likes: ['gombo', 'tomate', 'lait', 'oeuf', 'plantain'], hates: ['ganja'],
    lines: {
      low: ["Eh, toi, tu marches comme quelqu'un qui n'a pas encore pris son café.", "Dans mon temps, ici, il n'y avait même pas de pont."],
      mid: ["Mon petit-fils Delroy ne tient pas en place. Si tu le vois, dis-lui de manger.", "Une bonne soupe de giraumon, ça répare tout."],
      high: ["Tu me rappelles ma jeunesse, avec un peu moins de poussière sur les bottes.", "Prends cette bénédiction : que tes récoltes soient toujours grosses."] },
    rain: ["Je reste ici avec mon thé. À mon âge, on n'attrape plus la pluie."] },
];
const NPC_BY_ID = Object.fromEntries(NPC_DEFS.map(n => [n.id, n]));
const NAMES_ANIMALS = ['Bobo', 'Cocoa', 'Ziggy', 'Mango', 'Pepper', 'Sunny', 'Irie', 'Nanny', 'Rasta', 'Coco', 'Dub', 'Kiwi', 'Jerk', 'Sugar', 'Tiki', 'Bamboo'];

// Quêtes (objectif chiffré ou livraison à un villageois)
const QUESTS = [
  { id: 'till', title: 'Premiers sillons', desc: 'Laboure 6 cases dans ton champ avec la houe.', stat: 'tilled', n: 6, gold: 40 },
  { id: 'plant', title: 'Sème la bonne humeur', desc: 'Plante 6 graines, puis arrose-les.', stat: 'planted', n: 6, gold: 40 },
  { id: 'harvest', title: 'Première récolte', desc: 'Récolte 3 légumes.', stat: 'harvested', n: 3, gold: 90, item: ['s_patate', 5] },
  { id: 'meet', title: 'Salut le quartier', desc: 'Parle à tous les villageois.', stat: 'met', n: 6, gold: 120 },
  { id: 'fish1', title: 'À l\'eau !', desc: 'Pêche ton premier poisson.', stat: 'caught', n: 1, gold: 60 },
  { id: 'dpearl', title: 'Commande de Tante Pearl', desc: 'Livre 5 gombos à Tante Pearl.', deliver: ['pearl', 'gombo', 5], gold: 160, friend: 40 },
  { id: 'sell500', title: 'Premier petit pécule', desc: 'Gagne 500 g de ventes.', stat: 'earned', n: 500, gold: 100 },
  { id: 'coop', title: 'Poulailler en fête', desc: 'Achète ta première poule.', stat: 'chickens', n: 1, gold: 80, item: ['fourrage', 8] },
  { id: 'dwinston', title: 'Commande du Capitaine', desc: 'Livre 2 vivaneaux à Winston.', deliver: ['winston', 'vivaneau', 2], gold: 150, friend: 40, req: () => stat('caught') >= 1 },
  { id: 'eggs', title: 'Œufs frais', desc: 'Ramasse 5 œufs.', stat: 'eggs', n: 5, gold: 150, req: () => stat('chickens') >= 1 },
  { id: 'fashion', title: 'Un peu de style', desc: 'Achète 2 articles chez Desta.', stat: 'bought_cosm', n: 2, gold: 150 },
  { id: 'friend', title: 'Ami de Zion', desc: 'Atteins 4 cœurs avec Zion.', fn: () => hearts('zion'), n: 4, gold: 200 },
  { id: 'dzion', title: 'Épices pour Zion', desc: 'Livre 3 piments antillais à Zion.', deliver: ['zion', 'piment', 3], gold: 200, friend: 50, req: () => lvl('farm') >= 2 },
  { id: 'farm3', title: 'Main verte', desc: 'Atteins le niveau 3 en agriculture.', fn: () => lvl('farm'), n: 3, gold: 250 },
  { id: 'fish15', title: 'Pêcheur confirmé', desc: 'Pêche 15 poissons.', stat: 'caught', n: 15, gold: 300 },
  { id: 'cow', title: 'Belle vache !', desc: 'Achète une vache.', stat: 'cows', n: 1, gold: 300, item: ['fourrage', 10] },
  { id: 'upgrade', title: 'Du bon matériel', desc: 'Améliore un outil chez Winston.', stat: 'upgrades', n: 1, gold: 200 },
  { id: 'shells', title: 'Chasseur de coquillages', desc: 'Ramasse 10 coquillages sur la plage.', stat: 'shells', n: 10, gold: 220 },
  { id: 'dpineapple', title: 'Ananas pour Mama Ivy', desc: 'Livre 1 ananas à Mama Ivy.', deliver: ['ivy', 'ananas', 1], gold: 400, friend: 60, req: () => lvl('farm') >= 2 },
  { id: 'rich', title: 'Roi du yaad', desc: 'Gagne 10 000 g de ventes.', stat: 'earned', n: 10000, gold: 1000, item: ['jerk', 3] },
];
const SKILLS = {
  farm: { name: 'Agriculture', perks: ['Niv. 2 : giraumon et ananas', 'Niv. 3 : ganja', 'Chaque niveau : outils moins fatigants', 'Niv. 5 : récoltes parfois doublées'] },
  fish: { name: 'Pêche', perks: ['Chaque niveau : barre de prise plus large', 'Niv. 3 : touche plus vite', 'Niv. 5 : poissons rares plus fréquents'] },
  forage: { name: 'Cueillette', perks: ['Niv. 2 : plus de coquillages', 'Niv. 3 : noix de coco en double', 'Niv. 5 : trouvailles d\'or'] },
  ranch: { name: 'Élevage', perks: ['Chaque niveau : animaux plus heureux', 'Niv. 3 : produits premium plus fréquents'] },
};
const XP_T = [0, 60, 150, 280, 450, 680, 980, 1350, 1800, 2400];
const xpLevel = xp => { let l = 1; for (let k = 1; k < XP_T.length; k++) if (xp >= XP_T[k]) l = k + 1; return l; };

// =====================================================================
// État du jeu
// =====================================================================
const S = {};
const P = { x: 11, z: 13.4, face: 0, walk: 0 };
function defaultInv() {
  const a = new Array(INV_SIZE).fill(null);
  a[0] = { id: 'hoe', q: 1, t: 0 }; a[1] = { id: 'can', q: 1, t: 0 }; a[2] = { id: 'rod', q: 1, t: 0 };
  a[3] = { id: 'machette', q: 1, t: 0 }; a[4] = { id: 'pioche', q: 1, t: 0 };
  a[5] = { id: 's_gombo', q: 10 }; a[6] = { id: 's_patate', q: 4 };
  return a;
}
function resetState() {
  Object.assign(S, {
    day: 1, time: 360, gold: 500, energy: 100, inv: defaultInv(), sel: 0, water: canMax(0), ship: [],
    card: [0, 1], swing: 0, swingDur: 0.3, swingType: null, hold: false, modal: null, title: true, fade: false,
    fish: { phase: null }, zone: '', target: [0, 0], mouse: null, inside: false,
    xp: { farm: 0, fish: 0, forage: 0, ranch: 0, craft: 0 }, friends: {}, stats: {}, done: [],
    farmLvl: 0, built: { coop: false, barn: false }, building: null, unlocked: { gate: false, pier: false, lighthouse: false },
    nodes: [], placed: [], talents: {}, story: { ch: 1, frags: [], flags: {}, seen: [], forms: 0 }, slot: 1, godEnergy: false,
    animals: [], shed: { oeuf: 0, oeuf_or: 0, lait: 0, lait_creme: 0 },
    owned: ['hat_none', 'hat_straw', 'shirt_tank', 'gl_none'], eq: { hat: 'hat_straw', shirt: 'shirt_tank', gl: 'gl_none' },
    fishLog: {}, picked: { coco: [], shells: [] }, weather: 'sun', warned: false, pending: [],
  });
  Object.assign(P, { x: 11, z: 13.4, face: 0, walk: 0 });
}
resetState();

const stat = k => S.stats[k] || 0;
const bump = (k, n = 1) => { S.stats[k] = (S.stats[k] || 0) + n; checkQuests(); };
const lvl = sk => xpLevel(S.xp[sk]);
const friend = id => S.friends[id] || (S.friends[id] = { pts: 0, talked: 0, gifted: 0, met: false });
const hearts = id => Math.min(10, Math.floor(friend(id).pts / 60));
const toolTier = id => { const s = S.inv.find(s => s && s.id === id); return s ? s.t || 0 : 0; };
const itemName = s => { const it = ITEMS[s.id]; return it.kind === 'tool' ? TOOL_NAMES[s.id][s.t || 0] : it.name; };
const hasItem = id => S.inv.some(s => s && s.id === id);
const countItem = id => S.inv.reduce((a, s) => a + (s && s.id === id ? s.q : 0), 0);
const fmtH = m => { const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60 / 10) * 10; return `${h}h${String(mm).padStart(2, '0')}`; };
const isNight = () => S.time >= 1170 || S.time < 345;
