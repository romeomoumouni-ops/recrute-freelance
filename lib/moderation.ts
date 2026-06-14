// Détection (best-effort) des tentatives de contact hors plateforme.
// On NE bloque PAS le message : on le marque pour revue dans l'espace admin.
// Mieux vaut sur-flaguer (faux positifs tolérés) que laisser passer.

interface Rule {
  reason: string;
  test: RegExp;
}

// Normalise pour contrer les contournements (espaces, « at », « point », accents).
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/\(at\)|\[at\]|\s+at\s+|\s+arobase\s+/g, '@')
    .replace(/\(dot\)|\[dot\]|\s+dot\s+|\s+point\s+/g, '.');
}

const RULES: Rule[] = [
  { reason: 'adresse e-mail', test: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ },
  { reason: 'fournisseur e-mail', test: /\b(gmail|hotmail|yahoo|outlook|proton(mail)?|icloud)\b/ },
  { reason: 'mention e-mail', test: /\b(e-?mail|courriel|mon mail|ton mail|votre mail|adresse mail)\b/ },
  { reason: 'WhatsApp', test: /\b(whats\s?app|wa\.me|whatsap)\b/ },
  { reason: 'Instagram', test: /\b(instagram|insta|ig|gram)\b/ },
  { reason: 'Telegram', test: /\b(telegram|t\.me)\b/ },
  { reason: 'Snapchat', test: /\b(snapchat|snap)\b/ },
  { reason: 'autre réseau', test: /\b(messenger|facebook|\bfb\b|tiktok|signal|skype|discord)\b/ },
  { reason: 'pseudo / handle', test: /(^|\s)@[a-z0-9._]{3,}/ },
  { reason: 'numéro de téléphone', test: /(?:\+?\d[\s.\-]?){8,}/ },
  { reason: 'contact hors plateforme', test: /\b(hors (de la )?plateforme|en dehors de la plateforme|contacte?[- ]?moi (en )?direct|appelle[- ]?moi|appelez[- ]?moi|mon numero|ton numero|votre numero)\b/ },
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
