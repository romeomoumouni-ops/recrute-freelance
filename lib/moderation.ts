// Détection (best-effort) des tentatives de contact / transfert de coordonnées hors plateforme.
// On NE bloque PAS le message : on le marque pour revue dans l'espace admin.
// Philosophie : mieux vaut sur-flaguer (faux positifs tolérés) que laisser passer.

interface Rule {
  reason: string;
  test: RegExp;
}

// Normalise pour contrer les contournements (espaces, « at », « point », accents, ponctuation).
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/\(at\)|\[at\]|\s+at\s+|\s+arobase\s+/g, '@')
    .replace(/\(dot\)|\[dot\]|\s+dot\s+|\s+point\s+/g, '.')
    .replace(/\s*@\s*/g, '@') // « nom @ gmail » -> « nom@gmail »
    .replace(/\s*\.\s*/g, '.') // « gmail . com » -> « gmail.com »
    .replace(/\s+/g, ' ')
    .trim();
}

const RULES: Rule[] = [
  // ----- E-mail -----
  { reason: 'adresse e-mail', test: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ },
  {
    reason: 'fournisseur e-mail',
    test: /\b(gmail|hotmail|yahoo|ymail|outlook|live\.|msn|proton(mail)?|icloud|gmx|aol|laposte|sfr|orange\.fr|free\.fr)\b/,
  },
  {
    reason: 'mention e-mail',
    test: /\b(e-?mail|courriel|mail moi|mailmoi|mon mail|ton mail|votre mail|adresse mail|adresse e-?mail|arobase)\b/,
  },

  // ----- Réseaux sociaux & messageries -----
  { reason: 'WhatsApp', test: /\b(whats\s?app|wa\.me|whatsap|whatzap|watsap|wsp|watsup|whatasapp)\b/ },
  { reason: 'Instagram', test: /\b(instagram|insta|\big\b|gram)\b/ },
  { reason: 'Telegram', test: /\b(telegram|telega|t\.me)\b/ },
  { reason: 'Snapchat', test: /\b(snapchat|snap|snapchatte)\b/ },
  { reason: 'Facebook / Messenger', test: /\b(messenger|facebook|\bfb\b)\b/ },
  {
    reason: 'autre réseau',
    test: /\b(tiktok|signal|skype|discord|viber|wechat|we chat|kakao|\bline\b|linkedin|linked in|reddit|twitter|\bx\.com\b|threads|botim|\bimo\b)\b/,
  },
  { reason: 'pseudo / handle', test: /(^|\s)@[a-z0-9._]{3,}/ },
  {
    reason: 'partage de pseudo',
    test: /\b(mon (pseudo|identifiant|compte|contact|profil|id)|ajoute[- ]?moi|ajoutez[- ]?moi|retrouve[- ]?moi sur|rejoins[- ]?moi sur|suis[- ]?moi sur|cherche[- ]?moi sur)\b/,
  },

  // ----- Téléphone -----
  { reason: 'numéro de téléphone', test: /(?:\+?\d[\s.\-]?){8,}/ },
  { reason: 'suite de chiffres', test: /(?:\d[\s.\-]?){6,}/ },
  {
    reason: 'numéro en toutes lettres',
    test: /\b(zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\b(?:[\s.\-]+\b(zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\b){2,}/,
  },
  {
    reason: 'mention téléphone',
    test: /\b(telephone|portable|gsm|numero|appelle?[- ]?moi|appelez[- ]?moi|rappelle?[- ]?moi|joins[- ]?moi|joindre|whatsappe?[- ]?moi|texto|mon numero|ton numero|votre numero)\b/,
  },

  // ----- Liens / sites externes -----
  { reason: 'lien externe', test: /\b(https?:\/\/|www\.|bit\.ly|linktr|t\.me|wa\.me|tinyurl|cutt\.ly|rebrand\.ly)\b/ },
  {
    reason: 'nom de domaine',
    test: /[a-z0-9-]{2,}\.(com|net|org|fr|io|me|co|app|shop|biz|info|xyz|africa|ci|sn|cm|bj|tg)\b/,
  },

  // ----- Contournement explicite -----
  {
    reason: 'contact hors plateforme',
    test: /\b(hors (de la )?plateforme|en dehors de (la )?plateforme|en dehors du site|contacte?[- ]?moi (en )?direct|contacte?[- ]?moi (en )?prive|en prive|en mp|mp moi|envoie?[- ]?moi un mp|directement (sur|via|en)|sans passer par (le site|la plateforme))\b/,
  },
  {
    reason: 'paiement hors plateforme',
    test: /\b(paypal|western union|moneygram|\bria\b|\biban\b|\brib\b|virement|paye?[- ]?moi directement|paiement direct|hors commission|en especes|\bcash\b|de la main a la main|en liquide)\b/,
  },
];

export function detectOffPlatform(text: string): string[] {
  if (!text) return [];
  const n = normalize(text);
  const reasons = new Set<string>();
  for (const r of RULES) {
    if (r.test.test(n)) reasons.add(r.reason);
  }
  return [...reasons];
}
