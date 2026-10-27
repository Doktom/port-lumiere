// =====================================================================
// Données de progression : ressources, artisanat, talents, ferme, zones
// =====================================================================
Object.assign(TOOL_NAMES, {
  machette: ['Machette', 'Machette en fer', 'Machette dorée'],
  pioche: ['Pioche', 'Pioche en fer', 'Pioche dorée'],
});
Object.assign(TOOL_HINT, {
  machette: ['Coupe branches et broussailles', '+1 bois ou fibre par coup', '+2 bois ou fibre par coup'],
  pioche: ['Casse les rochers', '+1 pierre par coup, plus de quartz', '+2 pierres par coup, encore plus de quartz'],
});
Object.assign(ITEMS, {
  machette: { name: 'Machette', kind: 'tool' }, pioche: { name: 'Pioche', kind: 'tool' },
  bois: { name: 'Bois', kind: 'res', sell: 4 }, pierre: { name: 'Pierre', kind: 'res', sell: 3 }, fibre: { name: 'Fibre', kind: 'res', sell: 2 },
  quartz: { name: 'Quartz rose', kind: 'res', sell: 90 }, planche: { name: 'Planche', kind: 'res', sell: 15 }, corde: { name: 'Corde', kind: 'res', sell: 12 },
  engrais: { name: 'Engrais coco', kind: 'fert', sell: 10 }, arroseur: { name: 'Arroseur', kind: 'place', sell: 60 },
  appat: { name: 'Appât', kind: 'bait', sell: 5 }, kit_jetee: { name: 'Kit de jetée', kind: 'res' },
  jus_ananas: { name: "Jus d'ananas", kind: 'food', sell: 300, food: 60, crafted: true },
  poisson_grille: { name: 'Poisson grillé', kind: 'food', sell: 170, food: 70, crafted: true },
  gateau_coco: { name: 'Gâteau coco', kind: 'food', sell: 420, food: 80, crafted: true },
  soupe: { name: 'Soupe de giraumon', kind: 'food', sell: 520, food: 90, crafted: true },
});
for (const id in ITEMS) ITEMS[id].id = id;
SKILLS.craft = { name: 'Artisanat', perks: ['Chaque niveau débloque des recettes', 'Niv. 2 : arroseur et appât', 'Niv. 3 : kit de jetée et soupe'] };
SKILLS.forage.perks = ['Machette et pioche : plus de ressources', 'Niv. 2 : plus de coquillages', 'Niv. 3 : noix de coco en double', 'Niv. 5 : quartz plus fréquent'];

const RECIPES = [
  { id: 'planche', out: 2, need: { bois: 3 }, lvl: 1, tab: 'atelier' },
  { id: 'corde', out: 1, need: { fibre: 3 }, lvl: 1, tab: 'atelier' },
  { id: 'engrais', out: 3, need: { fibre: 2, coco: 1 }, lvl: 1, tab: 'atelier', hint: 'À poser sur une case labourée : +1 jour de pousse et meilleure qualité.' },
  { id: 'appat', out: 5, need: { fibre: 2, coquillage: 1 }, lvl: 2, tab: 'atelier', hint: 'Utilisé tout seul à chaque lancer : touche plus vite, poissons rares plus fréquents.' },
  { id: 'arroseur', out: 1, need: { planche: 2, pierre: 4, corde: 1 }, lvl: 2, tab: 'atelier', hint: 'À poser dans le champ : arrose les 8 cases autour chaque matin.' },
  { id: 'kit_jetee', out: 1, need: { planche: 6, corde: 2 }, lvl: 3, tab: 'atelier', hint: 'Répare le bout de la jetée.' },
  { id: 'jus_ananas', out: 1, need: { ananas: 1, coco: 1 }, lvl: 1, tab: 'cuisine' },
  { id: 'poisson_grille', out: 1, need: { vivaneau: 1, piment: 1 }, lvl: 1, tab: 'cuisine' },
  { id: 'gateau_coco', out: 1, need: { coco: 2, oeuf: 1, lait: 1 }, lvl: 2, tab: 'cuisine' },
  { id: 'soupe', out: 2, need: { giraumon: 1, piment: 1, patate: 1 }, lvl: 3, tab: 'cuisine' },
];
const TALENTS = {
  farm: [{ id: 'pousse', name: 'Pousse turbo', desc: '+6 % par rang : une culture pousse de 2 jours en une nuit' },
    { id: 'econome', name: 'Main légère', desc: '−10 % par rang d\'énergie pour la houe et l\'arrosoir' },
    { id: 'qualite', name: 'Œil du jardinier', desc: '+6 % par rang de récoltes argent ou or' }],
  fish: [{ id: 'patience', name: 'Patience zen', desc: '−12 % par rang d\'attente avant la touche' },
    { id: 'ligne', name: 'Ligne solide', desc: '+10 px par rang de barre de prise' },
    { id: 'flair', name: 'Flair marin', desc: '+20 % par rang de poissons rares' }],
  forage: [{ id: 'cueilleur', name: 'Mains agiles', desc: '+20 % par rang de chance de ressource bonus' },
    { id: 'bucheron', name: 'Bras de bûcheron', desc: '−15 % par rang d\'énergie pour la machette et la pioche' },
    { id: 'nez', name: 'Nez fin', desc: '+3 % par rang de trouver du quartz rose' }],
  ranch: [{ id: 'calin', name: 'Câlins magiques', desc: '+3 de bonheur par caresse et par rang' },
    { id: 'premium', name: 'Fermier premium', desc: '+6 % par rang de produits premium' },
    { id: 'gamelle', name: 'Gamelle maline', desc: '20 % par rang d\'économiser le fourrage' }],
  craft: [{ id: 'recycle', name: 'Recyclage', desc: '10 % par rang de ne pas consommer les ingrédients' },
    { id: 'serie', name: 'Production en série', desc: '10 % par rang de fabriquer un exemplaire bonus' },
    { id: 'marchand', name: 'Marchand', desc: '+5 % par rang au prix des plats et objets fabriqués' }],
};
const QUAL = [{ name: '', mult: 1 }, { name: 'argent', mult: 1.25, col: '#c9d3df' }, { name: 'or', mult: 1.5, col: '#f6c026' }];
// Champ cultivable selon le niveau de la ferme : [i0, j0, i1, j1]
const FARM_RECTS = [[12, 14, 21, 21], [12, 13, 27, 28], [5, 13, 30, 36], [5, 13, 32, 42]];
const FARM_UPG = [null,
  { gold: 500, need: { bois: 20 }, pl: 2 },
  { gold: 1500, need: { bois: 40, pierre: 20 }, pl: 4 },
  { gold: 4000, need: { bois: 60, pierre: 40, planche: 10 }, pl: 7 }];
const BUILDS = {
  coop: { name: 'Poulailler', gold: 800, need: { bois: 30, pierre: 15, corde: 2 }, pl: 3, ch: 2 },
  barn: { name: 'Étable', gold: 2500, need: { bois: 60, pierre: 30, planche: 10, corde: 4 }, pl: 6, ch: 2, after: 'coop' },
};
const LOCKS = {
  gate: { name: 'Portillon de la plage', desc: 'Le portillon sud de ton yard est coincé par la rouille et les lianes.', need: { corde: 2, planche: 5 }, box: [18, 44.85, 21, 45.15] },
  pier: { name: 'Bout de la jetée', desc: 'Les planches du bout de la jetée sont pourries. Personne n\'ose y aller.', need: { kit_jetee: 1 }, box: [61.9, 51.6, 65.1, 52.4] },
  lighthouse: { name: 'Porte du phare', desc: 'Une barrière grise devant la porte : « Propriété du Ministère des Formulaires. Accès sur permis uniquement. »', flag: 'permis', box: [87.8, 48.85, 89.2, 49.35] },
};
const DEBRIS = {
  branche: { name: 'Branches', tool: 'machette', hp: 1, drop: ['bois', 1, 3], en: 2 },
  broussaille: { name: 'Broussailles', tool: 'machette', hp: 1, drop: ['fibre', 1, 3], en: 1 },
  souche: { name: 'Souche', tool: 'machette', hp: 3, drop: ['bois', 3, 5], en: 3 },
  rocher: { name: 'Rocher', tool: 'pioche', hp: 2, drop: ['pierre', 2, 4], en: 3 },
};
const MAX_PL = 30;
SHOPS.boutique.buys = ['quartz', 'coquillage']; SHOPS.cafe.buys.push('food');
// Quêtes de progression supplémentaires, et animaux après la construction des bâtiments
QUESTS.unshift({ id: 'debris', title: 'Débroussaillage', desc: 'Dégage 8 débris avec la machette et la pioche.', stat: 'debris', n: 8, gold: 60 });
QUESTS.splice(QUESTS.findIndex(q => q.id === 'sell500'), 0,
  { id: 'craft', title: 'Bricoleur du dimanche', desc: "Fabrique 3 objets à l'atelier (touche K).", stat: 'crafted', n: 3, gold: 80 },
  { id: 'farmup', title: "Le yard s'agrandit", desc: 'Agrandis ton champ une première fois (panneau près de la case).', stat: 'farmup', n: 1, gold: 150 });
QUESTS.find(q => q.id === 'coop').req = () => S.built.coop;
QUESTS.find(q => q.id === 'cow').req = () => S.built.barn;
