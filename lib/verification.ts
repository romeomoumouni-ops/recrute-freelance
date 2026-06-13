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
}

// Les 6 critères de vérification du profil freelance.
export function getVerifChecks(input: VerifInput): VerifCheck[] {
  const bioLen = (input.bio || '').trim().length;
  return [
    {
      key: 'photo',
      titre: 'Photo de profil',
      desc: 'Une photo professionnelle rassure les clients.',
      ok: !!input.photoUrl,
      lien: '/mon-profil',
    },
    {
      key: 'titre-bio',
      titre: 'Titre & présentation',
      desc: "Votre métier et une bio d'au moins 50 caractères.",
      ok: !!(input.titre && input.titre.trim()) && bioLen >= 50,
      lien: '/mon-profil',
    },
    {
      key: 'portfolio',
      titre: 'Portfolio',
      desc: 'Au moins 2 réalisations en images.',
      ok: input.portfolioCount >= 2,
      lien: '/mon-profil',
    },
    {
      key: 'cv',
      titre: 'CV ou expérience',
      desc: 'Votre CV au format PDF.',
      ok: !!input.cvUrl,
      lien: '/mon-profil',
    },
    {
      key: 'service',
      titre: 'Au moins un service',
      desc: 'Créez une offre avec un tarif clair.',
      ok: input.servicesCount >= 1,
      lien: '/mon-profil',
    },
    {
      key: 'momo',
      titre: 'Numéro Mobile Money',
      desc: 'Pour recevoir vos paiements.',
      ok: !!(input.telephoneMomo && input.telephoneMomo.trim()),
      lien: '/parametres',
    },
  ];
}

export function isVerified(input: VerifInput): boolean {
  return getVerifChecks(input).every((c) => c.ok);
}

// Compte les compétences (utilisé indirectement ailleurs)
export function skillsCount(json: string | null | undefined): number {
  return parseSkills(json).length;
}
