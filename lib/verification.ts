import { parseSkills } from './utils';

export interface VerifInput {
  photoUrl?: string | null;
  titre?: string | null;
  bio?: string | null;
  skills?: string | null; // JSON
  cvUrl?: string | null;
  portfolioCount: number;
  servicesCount: number;
  telephoneMomo?: string | null;
}

export interface VerifCheck {
  key: string;
  titre: string;
  desc: string;
  ok: boolean;
  lien: string;
  optional?: boolean; // n'est pas requis pour valider le profil
}

// Critères de vérification du profil freelance (le CV est facultatif).
export function getVerifChecks(input: VerifInput): VerifCheck[] {
  const bioLen = (input.bio || '').trim().length;
  return [
    {
      key: 'photo',
      titre: 'Photo de profil (facultatif)',
      desc: 'Optionnel — une photo professionnelle vous fait remonter dans les résultats.',
      ok: !!input.photoUrl,
      lien: '/mon-profil',
      optional: true,
    },
    {
      key: 'titre-bio',
      titre: 'Titre & présentation',
      desc: 'Votre métier et une présentation (le texte que vous voulez, sans minimum).',
      ok: !!(input.titre && input.titre.trim()) && bioLen >= 1,
      lien: '/mon-profil',
    },
    {
      key: 'portfolio',
      titre: 'Portfolio (facultatif)',
      desc: 'Optionnel — ajoutez des réalisations en images pour rassurer les clients.',
      ok: input.portfolioCount >= 1,
      lien: '/mon-profil',
      optional: true,
    },
    {
      key: 'cv',
      titre: 'CV ou expérience (facultatif)',
      desc: 'Optionnel — votre CV au format PDF, pour rassurer davantage les clients.',
      ok: !!input.cvUrl,
      lien: '/mon-profil',
      optional: true,
    },
    {
      key: 'service',
      titre: 'Au moins un service (facultatif)',
      desc: 'Optionnel — créez une offre avec un tarif clair pour mieux ressortir.',
      ok: input.servicesCount >= 1,
      lien: '/mon-profil',
      optional: true,
    },
    {
      key: 'momo',
      titre: 'Numéro Mobile Money (facultatif)',
      desc: 'Optionnel ici, mais nécessaire pour recevoir vos paiements.',
      ok: !!(input.telephoneMomo && input.telephoneMomo.trim()),
      lien: '/parametres',
      optional: true,
    },
  ];
}

export function isVerified(input: VerifInput): boolean {
  // Seuls les critères requis (non facultatifs) doivent être remplis.
  return getVerifChecks(input)
    .filter((c) => !c.optional)
    .every((c) => c.ok);
}

// Compte les compétences (utilisé indirectement ailleurs)
export function skillsCount(json: string | null | undefined): number {
  return parseSkills(json).length;
}
