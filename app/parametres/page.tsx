import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifChecks } from '@/lib/verification';
import { asValidationStatus } from '@/lib/validation';
import ParametresClient from './ParametresClient';

export const metadata: Metadata = { title: 'Paramètres' };
export const dynamic = 'force-dynamic';

export default async function ParametresPage() {
  const session = await auth();
  if (!session) redirect('/connexion?callbackUrl=/parametres');

  const { data: user } = await supabaseAdmin()
    .from('User')
    .select(
      'prenom, email, role, pays, telephoneMomo, operateurMomo, notifPrefs, profile:Profile(photoUrl, titre, bio, cvUrl, statutValidation, motifRejet, services:Service(id), portfolio:PortfolioItem(id))'
    )
    .eq('id', session.user.id)
    .maybeSingle();
  if (!user) redirect('/connexion');

  const isFreelance = user.role === 'FREELANCE';
  // PostgREST peut renvoyer la relation imbriquée comme tableau OU objet : on normalise.
  const profileRaw = user.profile as unknown;
  const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
    | { photoUrl: string | null; titre: string | null; bio: string | null; cvUrl: string | null; statutValidation: string | null; motifRejet: string | null; services: unknown[]; portfolio: unknown[] }
    | null;

  const checks = isFreelance
    ? getVerifChecks({
        photoUrl: profile?.photoUrl,
        titre: profile?.titre,
        bio: profile?.bio,
        cvUrl: profile?.cvUrl,
        portfolioCount: (profile?.portfolio ?? []).length,
        servicesCount: (profile?.services ?? []).length,
        telephoneMomo: user.telephoneMomo,
      })
    : [];

  let notifs = { messages: true, missions: true, paiements: true, newsletter: false };
  if (user.notifPrefs) {
    try {
      notifs = { ...notifs, ...JSON.parse(user.notifPrefs) };
    } catch {
      /* ignore */
    }
  }

  return (
    <ParametresClient
      role={user.role as 'CLIENT' | 'FREELANCE'}
      compte={{ prenom: user.prenom, email: user.email, pays: user.pays ?? '' }}
      momo={{ telephoneMomo: user.telephoneMomo ?? '', operateurMomo: user.operateurMomo ?? '' }}
      checks={checks}
      statutValidation={asValidationStatus(profile?.statutValidation)}
      motifRejet={profile?.motifRejet ?? null}
      notifs={notifs}
    />
  );
}
