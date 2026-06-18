// Briefs de projets pour le moteur de test (bots « entreprise »).
// Rédigés à la main, ton humain et varié — pas de texte généré.
// Les clés correspondent aux catégories de la plateforme (lib/constants CATEGORIES).

const BRIEFS: Record<string, string[]> = {
  design: [
    "Bonjour, je lance une marque de cosmétiques naturels et il me faut un logo simple et élégant. J'aime bien l'épuré, dans les tons beige et vert sauge. Vous pourriez me proposer 2 ou 3 pistes ?",
    "Salut, on ouvre un food truck de burgers le mois prochain. On cherche un logo qui claque, un peu style street, mais qui reste lisible de loin sur le camion. C'est jouable ?",
    "Bonjour, j'ai besoin de refaire le logo de mon cabinet comptable, l'actuel fait vraiment vieillot. Je veux quelque chose de sérieux et moderne, plutôt bleu nuit. Vous faites aussi la charte des couleurs ?",
    "Hello, je monte une petite marque de vêtements de sport et j'aimerais un logo + un petit pack identité (couleurs, typo). J'ai quelques refs en tête, je peux te les envoyer.",
    "Bonjour, on a besoin d'un logo pour une appli de livraison de repas. Faut que ça fasse jeune et dynamique, et que ça rende bien en tout petit (icône d'appli). Merci d'avance.",
  ],
  dev: [
    "Bonjour, j'ai une PME dans le BTP et notre site date de 2015… On voudrait un site vitrine moderne, 5-6 pages, avec un formulaire de devis. Possible de voir ce que vous proposez ?",
    "Salut, je vends des produits faits main et j'aimerais une petite boutique en ligne pour commencer (une vingtaine de produits, paiement par carte). Tu gères ce genre de projet ?",
    "Bonjour, on cherche quelqu'un pour développer un site de réservation pour notre salon de coiffure (prise de rdv en ligne + rappels). On est pressés, c'est faisable rapidement ?",
    "Hello, j'ai un site WordPress qui rame énormément et qui plante sur mobile. J'aurais besoin de quelqu'un pour l'optimiser et corriger les bugs. Tu peux jeter un œil ?",
    "Bonjour, on est une asso et on voudrait un site simple pour présenter nos actions et récolter des dons en ligne. Budget pas énorme mais on veut quelque chose de propre.",
  ],
  ia: [
    "Bonjour, on reçoit énormément de mails clients et j'aimerais mettre en place un chatbot qui répond aux questions les plus fréquentes. Vous avez déjà fait ce genre d'intégration ?",
    "Salut, je voudrais automatiser la relance de mes factures impayées (emails automatiques selon le retard). C'est quelque chose que tu peux mettre en place ?",
    "Bonjour, on a une base de plusieurs milliers de fiches produits à enrichir/réécrire automatiquement. Est-ce qu'un outil IA pourrait nous faire gagner du temps là-dessus ?",
    "Hello, j'aimerais un petit assistant qui résume automatiquement nos comptes-rendus de réunion et en sort les tâches à faire. Tu penses que c'est réalisable ?",
  ],
  marketing: [
    "Bonjour, on lance un nouveau produit et j'aurais besoin d'aide pour la pub en ligne (Meta surtout). On a déjà un peu de budget mais on sait pas trop comment le dépenser intelligemment.",
    "Salut, mon site ne ressort pas du tout sur Google. J'aimerais quelqu'un pour bosser le référencement et m'expliquer concrètement quoi faire. Tu fais du SEO ?",
    "Bonjour, je voudrais mettre en place une newsletter et une vraie stratégie d'emailing pour fidéliser mes clients. Vous accompagnez sur ce genre de chose ?",
    "Hello, on a une boutique en ligne et nos pubs coûtent cher pour pas grand-chose. J'aimerais que quelqu'un audite nos campagnes et nous dise quoi corriger.",
  ],
  audiovisuel: [
    "Bonjour, j'ai filmé pas mal de rushes lors de notre événement d'entreprise et j'aimerais un montage dynamique de 2-3 min pour LinkedIn. Vous gérez le montage + la musique ?",
    "Salut, je lance une chaîne YouTube et j'ai besoin de quelqu'un pour monter mes vidéos chaque semaine (coupes, sous-titres, petites animations). Tu serais dispo en régulier ?",
    "Bonjour, on voudrait une petite vidéo animée (motion design) d'une minute pour expliquer notre service sur la page d'accueil. Vous faites ce style ?",
    "Hello, j'ai besoin d'une dizaine de vidéos courtes format vertical pour TikTok/Reels à partir d'une interview que j'ai filmée. C'est dans tes cordes ?",
  ],
  redaction: [
    "Bonjour, j'ai un blog d'entreprise complètement à l'abandon. J'aimerais quelqu'un pour écrire des articles réguliers et optimisés SEO. On peut partir sur quelques articles pour tester ?",
    "Salut, je dois refaire tous les textes de mon site (page d'accueil, à propos, services). Le ton actuel est trop plat. Tu fais de la rédaction web qui donne envie ?",
    "Bonjour, je lance une newsletter et il me faut quelqu'un pour la rédiger chaque semaine, sur un ton sympa et pas trop corporate. Ça vous intéresse ?",
    "Hello, j'ai besoin de fiches produits bien écrites pour ma boutique en ligne (une trentaine pour commencer). Faut que ça donne envie d'acheter sans en faire trop.",
  ],
  social: [
    "Bonjour, je n'ai pas le temps de gérer mes réseaux. J'aimerais quelqu'un pour s'occuper de mon Instagram (création de contenu + publications régulières). Vous proposez ce genre de forfait ?",
    "Salut, on est un restaurant et on aimerait être plus présents sur Insta et TikTok. Il nous faut quelqu'un pour créer du contenu sympa et gérer la communauté. Tu fais ça ?",
    "Bonjour, je voudrais lancer ma page LinkedIn entreprise sérieusement : ligne éditoriale, posts réguliers, un peu de stratégie. Vous accompagnez là-dessus ?",
    "Hello, j'ai besoin d'un calendrier de contenu sur un mois pour mes réseaux + les visuels qui vont avec. C'est quelque chose que tu peux livrer ?",
  ],
  business: [
    "Bonjour, je prépare la levée de fonds de ma startup et il me faut un pitch deck propre et convaincant. J'ai le contenu, c'est surtout la mise en forme et la structure qui pèchent.",
    "Salut, je me lance en freelance et j'aimerais quelqu'un pour m'aider à construire mon offre et fixer mes prix. Tu fais du conseil de ce type ?",
    "Bonjour, j'ai besoin d'un business plan solide pour une demande de financement à la banque. Vous avez déjà accompagné des créateurs d'entreprise là-dessus ?",
    "Hello, on est une petite équipe et on s'éparpille. J'aimerais quelqu'un pour nous aider à organiser nos process et nos outils. C'est dans tes compétences ?",
  ],
};

// Briefs « sur mesure » génériques quand le freelance n'a pas de catégorie exploitable.
const GENERIC: string[] = [
  "Bonjour, j'ai vu votre profil et votre travail me plaît beaucoup. J'ai un projet en cours et j'aimerais savoir si on peut en discuter. Je vous envoie une première idée de budget.",
  "Salut, je cherche quelqu'un de sérieux pour un projet assez urgent. Ton profil correspond bien à ce que je cherche. Tu es dispo en ce moment ?",
  "Bonjour, on a un projet à lancer rapidement et votre profil ressort vraiment du lot. Est-ce qu'on peut échanger sur les détails ? Voici une première proposition.",
];

const CATEGORY_KEYS = Object.keys(BRIEFS);

// Choisit un brief pour une catégorie donnée (ou générique / au hasard si absente).
// `seed` (ex. index ou hash) rend le choix déterministe et varié sans Math.random.
export function pickBrief(cat: string | null | undefined, seed: number): string {
  const key = cat && BRIEFS[cat] ? cat : null;
  if (!key) {
    // Pas de catégorie : on pioche soit un brief générique, soit une catégorie au hasard.
    if (seed % 3 === 0) return GENERIC[seed % GENERIC.length];
    const rk = CATEGORY_KEYS[seed % CATEGORY_KEYS.length];
    const arr = BRIEFS[rk];
    return arr[seed % arr.length];
  }
  const arr = BRIEFS[key];
  return arr[seed % arr.length];
}

// Montant de la demande de devis : entre 300 et 1000 €, par paliers de 50 pour rester crédible.
export function pickAmount(seed: number): number {
  const paliers = [300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
  return paliers[seed % paliers.length];
}
