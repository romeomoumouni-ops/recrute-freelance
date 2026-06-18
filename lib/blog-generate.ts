import 'server-only';
import type { Block } from './blog';

const MODEL = process.env.BLOG_MODEL || 'claude-haiku-4-5-20251001';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';

const CATEGORIES = [
  // Orientés ENTREPRISES / clients (prioritaires)
  'Recruter un freelance',
  'Guide entreprise',
  'Déléguer',
  'Coûts & budget',
  'Freelance Afrique',
  // Orientés freelances
  'Tarification',
  'Relation client',
  'Productivité',
  'Prospection',
  'Qualité',
];

export interface GeneratedArticle {
  title: string;
  excerpt: string;
  category: string;
  metaDescription: string;
  readMins: number;
  blocks: Block[];
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

const SYSTEM = `Tu es rédacteur SEO pour recrutefreelance.com, une plateforme qui permet aux entreprises et entrepreneurs (souvent en Europe) de trouver et recruter des freelances francophones d'Afrique : talents performants, tarifs compétitifs, même langue, paiement sécurisé en séquestre et versement sur Mobile Money.
Tu écris des articles de blog ORIGINAUX, utiles et optimisés pour le référencement (SEO) en français.
PRIORITÉ (environ 3 articles sur 4) : des articles destinés aux ENTREPRISES/CLIENTS qui cherchent à déléguer ou recruter un freelance. Vise les requêtes Google de ces clients : « trouver un freelance », « recruter un freelance », « freelance pas cher », « freelance Afrique francophone », « déléguer / externaliser », « combien coûte un freelance », « freelance vs agence », etc.
Le reste (environ 1 sur 4) : des articles destinés aux freelances.
Règles :
- Contenu 100% original, jamais copié.
- Ton concret, orienté action, qui inspire confiance.
- SEO : titre accrocheur contenant des mots-clés recherchés, sous-titres clairs, paragraphes courts.
- Pour les articles « entreprises », mets subtilement en avant l'intérêt de recruter des freelances africains francophones via la plateforme (qualité, coût, paiement sécurisé) sans publicité lourde.
- Modèle économique exact (si tu l'évoques) : la plateforme est 100% GRATUITE pour les entreprises ; les freelances ont un abonnement (7 jours d'essai gratuits, puis 20 000 FCFA/mois) et AUCUNE commission n'est prélevée sur les missions. N'invente JAMAIS de pourcentage de commission.
- Tu réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans balise Markdown.`;

function buildPrompt(existingTitles: string[]): string {
  return `Rédige un NOUVEL article de blog (différent de ceux déjà publiés).
Choisis de préférence un sujet destiné aux ENTREPRISES qui cherchent un freelance (recrutement, délégation, budget, choix du bon profil). Un article sur quatre environ peut viser les freelances.

Titres DÉJÀ publiés (à NE PAS répéter, choisis un sujet et un angle nouveaux) :
${existingTitles.slice(0, 60).map((t) => `- ${t}`).join('\n') || '(aucun)'}

Catégories possibles : ${CATEGORIES.join(', ')}.

Réponds STRICTEMENT avec cet objet JSON (et rien d'autre) :
{
  "title": "Titre SEO accrocheur (max 70 caractères, avec mots-clés recherchés)",
  "excerpt": "Résumé d'accroche en 1-2 phrases (max 180 caractères)",
  "category": "une des catégories proposées",
  "metaDescription": "Méta description SEO (max 155 caractères)",
  "readMins": 5,
  "blocks": [
    { "p": "paragraphe d'introduction" },
    { "h": "Sous-titre" },
    { "p": "paragraphe" },
    { "h": "Autre sous-titre" },
    { "p": "paragraphe" },
    { "list": ["point 1", "point 2", "point 3"] },
    { "h": "Sous-titre" },
    { "p": "paragraphe de conclusion" }
  ]
}

Contraintes : entre 6 et 11 blocs, paragraphes de 2 à 4 phrases, au moins 3 sous-titres (h), idéalement une liste. Termine par un appel à l'action discret invitant à trouver/recruter un freelance sur recrutefreelance.com (pour les articles entreprises).`;
}

function extractJson(text: string): GeneratedArticle | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    if (!obj.title || !Array.isArray(obj.blocks) || obj.blocks.length === 0) return null;
    return {
      title: String(obj.title).slice(0, 90),
      excerpt: String(obj.excerpt ?? '').slice(0, 220),
      category: CATEGORIES.includes(obj.category) ? obj.category : 'Conseils',
      metaDescription: String(obj.metaDescription ?? obj.excerpt ?? '').slice(0, 160),
      readMins: Number(obj.readMins) > 0 ? Math.min(15, Number(obj.readMins)) : 5,
      blocks: (obj.blocks as unknown[])
        .map((b) => {
          const bl = b as { h?: unknown; p?: unknown; list?: unknown };
          const out: Block = {};
          if (typeof bl.h === 'string') out.h = bl.h;
          if (typeof bl.p === 'string') out.p = bl.p;
          if (Array.isArray(bl.list)) out.list = bl.list.filter((x) => typeof x === 'string') as string[];
          return out;
        })
        .filter((b) => b.h || b.p || (b.list && b.list.length)),
    };
  } catch {
    return null;
  }
}

// Génère un article via l'API Claude. Renvoie null si pas de clé ou échec.
export async function generateArticle(existingTitles: string[]): Promise<GeneratedArticle | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2200,
        system: SYSTEM,
        messages: [{ role: 'user', content: buildPrompt(existingTitles) }],
      }),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[blog-generate] Anthropic', res.status, (await res.text().catch(() => '')).slice(0, 300));
      return null;
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('\n');
    return extractJson(text);
  } catch (e) {
    console.error('[blog-generate] erreur', e);
    return null;
  }
}
