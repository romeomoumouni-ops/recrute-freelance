import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifChecks } from '@/lib/verification';
import ParametresClient from './ParametresClient';

export const metadata: Metadata = { title: 'Paramètres' };
export const dynamic = 'force-dynamic';

export default async function ParametresPage() {
  const session = await auth();
  if (!session) redirect('/connexion?callbackUrl=/parametres');
  if (session.user.banni) redirect('/compte-suspendu');

  const { data: user } = await supabaseAdmin()
    .from('User')
    .select(
      'prenom, email, role, pays, telephoneMomo, operateurMomo, notifPrefs, profile:Profile(photoUrl, titre, bio, cvUrl, services:Service(id), portfolio:PortfolioItem(id))'
    )
    .eq('id', session.user.id)
    .maybeSingle();
  if (!user) redirect('/connexion');

  const isFreelance = user.role === 'FREELANCE';
  const profile = user.profile as unknown as
    | { photoUrl: string | null; titre: string | null; bio: string | null; cvUrl: string | null; services: unknown[]; portfolio: unknown[] }
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
      notifs={notifs}
    />
  );
}
