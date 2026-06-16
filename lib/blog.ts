import 'server-only';
import { supabaseAdmin } from './supabase';

// Contenu de blog 100% original (conseils freelances). Aucun texte copié de tiers.
// Articles statiques de base + articles publiés quotidiennement (table BlogPost).

export interface Block {
  h?: string; // sous-titre
  p?: string; // paragraphe
  list?: string[]; // liste à puces
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readMins: number;
  blocks: Block[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'fixer-ses-tarifs-freelance',
    title: 'Comment fixer ses tarifs de freelance sans se brader',
    excerpt:
      "Trouver le juste prix est l'une des décisions les plus rentables de votre activité. Voici une méthode simple pour fixer des tarifs qui vous respectent.",
    category: 'Tarification',
    readMins: 6,
    blocks: [
      { p: "Beaucoup de freelances fixent leurs prix « au feeling » ou en copiant le voisin. Résultat : ils travaillent beaucoup pour gagner peu. Pourtant, votre tarif n'est pas qu'un chiffre — c'est un signal de qualité et de confiance." },
      { h: 'Partez de vos besoins réels, pas seulement du marché' },
      { p: "Calculez d'abord combien vous devez gagner par mois pour vivre correctement et investir dans votre activité (matériel, formation, connexion). Divisez ensuite par le nombre d'heures réellement facturables — rarement plus de 4 à 5 heures par jour une fois retirés la prospection, les échanges et l'administratif." },
      { h: 'Facturez au projet, pas à l\'heure' },
      { p: "Le client se moque du temps que vous passez : il achète un résultat. Un prix au forfait vous protège (si vous êtes rapide, vous gagnez mieux) et rassure le client (il connaît le montant à l'avance). Estimez le temps, ajoutez une marge de sécurité de 20 %, puis convertissez en prix fixe." },
      { h: 'Proposez plusieurs paliers' },
      { p: "Offrez par exemple une version essentielle, une version complète et une version premium. La plupart des clients choisissent l'option du milieu — et vous augmentez votre panier moyen sans effort de vente." },
      { list: [
        'Essentiel : le strict nécessaire, pour les petits budgets.',
        'Complet : votre offre recommandée, la plus choisie.',
        'Premium : livraison rapide, révisions illimitées, accompagnement.',
      ] },
      { h: 'Augmentez régulièrement' },
      { p: "Chaque fois que votre carnet se remplit ou que vous gagnez en compétence, augmentez vos prix de 10 à 15 % pour les nouveaux clients. Un tarif qui ne bouge jamais est un tarif qui recule, car le coût de la vie, lui, augmente." },
      { p: "Enfin, rappelez-vous : un prix trop bas attire les clients les plus difficiles. Un prix juste attire des clients sérieux qui respectent votre travail." },
    ],
  },
  {
    slug: 'rediger-un-devis-qui-convertit',
    title: 'Rédiger un devis qui donne envie de dire oui',
    excerpt:
      "Un bon devis ne se contente pas d'annoncer un prix : il rassure, clarifie et vend. Voici comment transformer vos devis en commandes.",
    category: 'Vente',
    readMins: 5,
    blocks: [
      { p: "Le devis est souvent le dernier obstacle entre vous et la mission. S'il est flou ou impersonnel, le client hésite. S'il est clair et professionnel, il signe." },
      { h: 'Reformulez le besoin du client' },
      { p: "Commencez par résumer ce que le client veut, avec ses propres mots. Cela prouve que vous avez compris son problème — et un client qui se sent compris fait confiance." },
      { h: 'Décrivez ce qui est inclus… et ce qui ne l\'est pas' },
      { p: "Listez précisément les livrables, le nombre de révisions et le délai. Indiquez aussi clairement ce qui n'est pas compris (par exemple les visuels supplémentaires). C'est ce qui vous évitera les demandes sans fin une fois la mission lancée." },
      { h: 'Donnez un prix unique et un délai ferme' },
      { p: "Évitez les fourchettes (« entre X et Y »), qui inquiètent. Un prix net et un délai daté donnent une impression de maîtrise." },
      { h: 'Ajoutez une raison d\'agir maintenant' },
      { p: "Une disponibilité limitée, un tarif valable quelques jours, ou un bonus pour une réponse rapide aident le client à décider sans pression excessive." },
      { p: "Sur recrutefreelance.com, envoyez votre devis directement dans la messagerie : le client peut le régler en un clic, et les fonds sont sécurisés jusqu'à la validation — un argument de confiance que vous pouvez rappeler dans votre message." },
    ],
  },
  {
    slug: 'negocier-sans-perdre-la-mission',
    title: 'Bien négocier avec un client sans perdre la mission',
    excerpt:
      'Négocier ne veut pas dire baisser son prix. Apprenez à défendre votre valeur tout en gardant une relation saine avec le client.',
    category: 'Négociation',
    readMins: 6,
    blocks: [
      { p: "« C'est trop cher. » Cette phrase n'est pas un refus, c'est une invitation à discuter. La manière dont vous y répondez fait toute la différence." },
      { h: 'Ne baissez jamais le prix sans réduire la prestation' },
      { p: "Si vous accordez une remise sans rien retirer, vous envoyez un message dangereux : que votre premier prix était gonflé. Préférez ajuster le périmètre : « Je peux m'aligner sur ce budget en retirant telle option. »" },
      { h: 'Vendez la valeur, pas la tâche' },
      { p: "Un client ne paie pas pour un logo, il paie pour une image qui inspire confiance et attire des clients. Reliez toujours votre travail à un bénéfice concret pour lui." },
      { h: 'Posez des questions avant de vous justifier' },
      { p: "« Qu'est-ce qui vous fait dire que c'est élevé ? » ou « Quel budget aviez-vous prévu ? » vous donnent les informations pour répondre juste, au lieu de deviner et de céder trop vite." },
      { h: 'Sachez dire non' },
      { p: "Tous les clients ne sont pas pour vous. Refuser poliment un projet sous-payé libère du temps et de l'énergie pour de meilleures missions — et, paradoxalement, renforce votre crédibilité." },
      { list: [
        'Restez calme et factuel, jamais sur la défensive.',
        'Proposez une alternative plutôt qu\'un simple refus.',
        'Gardez la porte ouverte pour l\'avenir.',
      ] },
    ],
  },
  {
    slug: 'portfolio-qui-inspire-confiance',
    title: 'Construire un portfolio qui inspire confiance',
    excerpt:
      "Vos clients achètent ce qu'ils voient. Un portfolio clair et bien présenté vaut mieux que mille promesses.",
    category: 'Profil',
    readMins: 5,
    blocks: [
      { p: "Quand un client découvre votre profil, il se pose une seule question : « Cette personne peut-elle résoudre mon problème ? » Votre portfolio doit y répondre en quelques secondes." },
      { h: 'Montrez vos meilleurs travaux, pas tous vos travaux' },
      { p: "Trois à cinq réalisations excellentes valent mieux que vingt projets moyens. Sélectionnez ceux qui ressemblent aux missions que vous voulez décrocher." },
      { h: 'Racontez le résultat, pas seulement le rendu' },
      { p: "Pour chaque projet, ajoutez une phrase de contexte : le besoin du client, ce que vous avez fait, et le résultat obtenu. « Site refait → +30 % de demandes de devis » est bien plus convaincant qu'une simple image." },
      { h: 'Soignez la première impression' },
      { p: "Une photo de profil professionnelle, un titre clair (« Développeur web spécialisé e-commerce ») et une présentation sans fautes inspirent immédiatement le sérieux." },
      { h: 'Mettez-le à jour régulièrement' },
      { p: "Ajoutez vos nouvelles réalisations dès qu'elles sont prêtes. Un profil vivant montre une activité réelle — et les clients préfèrent un freelance visiblement actif." },
      { p: "Sur recrutefreelance.com, un profil complet (photo, présentation, portfolio, services, CV) est la condition pour être validé et apparaître auprès des clients. Prenez le temps de bien le construire : c'est votre vitrine." },
    ],
  },
  {
    slug: 'communiquer-avec-un-client-europeen',
    title: 'Communiquer avec un client européen : les bonnes pratiques',
    excerpt:
      'La langue est la même, mais les attentes diffèrent. Voici comment instaurer une collaboration fluide et professionnelle à distance.',
    category: 'Relation client',
    readMins: 6,
    blocks: [
      { p: "Travailler avec des entreprises européennes est une formidable opportunité. Pour en profiter pleinement, quelques habitudes de communication font toute la différence." },
      { h: 'Répondez vite, même brièvement' },
      { p: "Vous n'êtes pas obligé d'avoir la réponse complète immédiatement. Un simple « Bien reçu, je reviens vers vous avant ce soir » rassure énormément et vous démarque." },
      { h: 'Annoncez vos délais et tenez-les' },
      { p: "La ponctualité est, pour beaucoup de clients européens, un critère décisif. Promettez un délai réaliste — quitte à annoncer un peu plus large — et livrez à temps, voire en avance." },
      { h: 'Faites des points réguliers' },
      { p: "Sur une mission de plusieurs jours, envoyez une courte mise à jour de l'avancement. Le silence inquiète ; un message régulier installe la confiance." },
      { h: 'Anticipez le décalage horaire' },
      { p: "Il est faible mais réel. Indiquez vos heures de disponibilité et confirmez les rendez-vous la veille pour éviter les malentendus." },
      { h: 'Restez professionnel jusqu\'au bout' },
      { p: "Un message de remerciement après la livraison, et une question sur la satisfaction du client, ouvrent souvent la porte à une nouvelle mission ou à une recommandation." },
    ],
  },
  {
    slug: 'livrer-qualite-obtenir-de-bons-avis',
    title: 'Livrer un travail de qualité et obtenir d\'excellents avis',
    excerpt:
      'Les avis sont le carburant de votre activité freelance. Voici comment livrer un travail qui donne envie de vous recommander.',
    category: 'Qualité',
    readMins: 5,
    blocks: [
      { p: "Sur une plateforme, vos avis font votre réputation. Un client satisfait revient et vous recommande ; un client déçu peut freiner des dizaines de futures missions. La bonne nouvelle : la qualité se travaille." },
      { h: 'Livrez ce qui était promis, puis un peu plus' },
      { p: "Respectez scrupuleusement le devis, puis ajoutez un petit « plus » inattendu : un conseil, un format supplémentaire, une astuce d'utilisation. C'est ce détail qui transforme un client satisfait en client enthousiaste." },
      { h: 'Vérifiez avant d\'envoyer' },
      { p: "Relisez, testez, contrôlez. Une livraison sans fautes ni bugs montre votre professionnalisme mieux que n'importe quel argument." },
      { h: 'Facilitez la validation' },
      { p: "Expliquez clairement ce que vous livrez et comment l'utiliser. Un client qui comprend tout de suite valide plus vite — et vous êtes payé plus vite." },
      { h: 'Demandez l\'avis, simplement' },
      { p: "Après une livraison réussie, un message poli suffit : « Si le travail vous convient, un avis m'aiderait beaucoup. » La plupart des clients satisfaits acceptent volontiers." },
      { p: "Rappelez-vous : sur recrutefreelance.com, le paiement est libéré à la validation. Une livraison soignée, c'est donc aussi un paiement plus rapide." },
    ],
  },
  {
    slug: 'eviter-les-pieges-du-freelance',
    title: 'Éviter les pièges : dérapage de projet, retards et impayés',
    excerpt:
      'Quelques réflexes simples vous évitent les situations qui font perdre du temps, de l\'argent et de la sérénité.',
    category: 'Organisation',
    readMins: 6,
    blocks: [
      { p: "La plupart des mauvaises expériences en freelance ne viennent pas de clients malhonnêtes, mais d'un cadre mal posé au départ. Voici comment vous protéger." },
      { h: 'Cadrez le périmètre dès le devis' },
      { p: "Le « dérapage de projet » (le client qui demande toujours plus sans payer plus) est le piège n°1. Écrivez noir sur blanc ce qui est inclus et combien de révisions sont prévues. Au-delà, c'est un devis complémentaire — annoncé gentiment mais fermement." },
      { h: 'Ne travaillez jamais sans accord clair' },
      { p: "Pas de commande, pas de travail. Attendez que le devis soit accepté et payé avant de commencer. C'est une règle simple qui élimine la majorité des impayés." },
      { h: 'Sécurisez votre paiement' },
      { p: "Restez sur la plateforme. Le paiement y est placé en séquestre : le client paie d'avance, les fonds sont conservés, et vous êtes réglé à la validation. Accepter de travailler « en direct » hors plateforme, c'est renoncer à cette protection — et s'exposer aux impayés." },
      { h: 'Gardez une trace de tout' },
      { p: "Échangez et validez les étapes par écrit, dans la messagerie. En cas de désaccord, ces messages sont votre meilleure preuve." },
      { list: [
        'Un périmètre écrit = pas de mauvaise surprise.',
        'Un paiement sécurisé = pas d\'impayé.',
        'Des échanges écrits = pas de malentendu.',
      ] },
      { p: "En posant ce cadre dès le début, vous transformez le freelancing en une activité sereine et durable." },
    ],
  },
];

interface DbRow {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  blocks: unknown;
  readMins: number | null;
}

function rowToArticle(r: DbRow): Article {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? '',
    category: r.category ?? 'Conseils',
    readMins: r.readMins ?? 5,
    blocks: Array.isArray(r.blocks) ? (r.blocks as Block[]) : [],
  };
}

async function dbArticles(): Promise<Article[]> {
  try {
    const { data } = await supabaseAdmin()
      .from('BlogPost')
      .select('slug, title, excerpt, category, blocks, readMins')
      .eq('published', true)
      .order('createdAt', { ascending: false });
    return ((data as DbRow[]) ?? []).map(rowToArticle);
  } catch {
    return [];
  }
}

// Articles publiés quotidiennement en premier, puis les articles de base.
export async function listArticles(): Promise<Article[]> {
  const db = await dbArticles();
  return [...db, ...ARTICLES];
}

export async function getArticle(slug: string): Promise<Article | null> {
  const fromStatic = ARTICLES.find((a) => a.slug === slug);
  if (fromStatic) return fromStatic;
  try {
    const { data } = await supabaseAdmin()
      .from('BlogPost')
      .select('slug, title, excerpt, category, blocks, readMins')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    return data ? rowToArticle(data as DbRow) : null;
  } catch {
    return null;
  }
}
