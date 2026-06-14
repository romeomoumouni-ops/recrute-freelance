import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { OPERATEUR_LABEL } from '@/lib/constants';
import DashboardClient, { type ClientOrder, type FreelanceOrder } from './DashboardClient';

export const metadata: Metadata = { title: 'Tableau de bord' };
export const dynamic = 'force-dynamic';

function hasReview(r: unknown): boolean {
  if (Array.isArray(r)) return r.length > 0;
  return !!r;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/connexion?callbackUrl=/dashboard');
  if (session.user.banni) redirect('/compte-suspendu');
  const userId = session.user.id;
  const sb = supabaseAdmin();

  if (session.user.role === 'CLIENT') {
    const { data: orders } = await sb
      .from('Order')
      .select(
        'id, titre, montant, commission, statut, createdAt, freelance:User!Order_freelanceId_fkey(prenom, operateurMomo), review:Review(id)'
      )
      .eq('clientId', userId)
      .order('createdAt', { ascending: false });

    type Row = {
      id: string; titre: string; montant: number; commission: number; statut: string; createdAt: string;
      freelance: { prenom: string; operateurMomo: string | null } | null;
      review: unknown;
    };

    const data: ClientOrder[] = ((orders as unknown as Row[]) ?? []).map((o) => ({
      id: o.id,
      titre: o.titre,
      freelance: o.freelance?.prenom ?? '—',
      momoLabel: o.freelance?.operateurMomo ? OPERATEUR_LABEL[o.freelance.operateurMomo] : 'Mobile Money',
      total: o.montant + o.commission,
      date: o.createdAt,
      statut: o.statut as ClientOrder['statut'],
      hasReview: hasReview(o.review),
    }));

    return <DashboardClient role="CLIENT" prenom={session.user.prenom} clientOrders={data} />;
  }

  // FREELANCE
  const [{ data: orders }, { data: profile }, { data: user }] = await Promise.all([
    sb
      .from('Order')
      .select('id, titre, montant, statut, createdAt, client:User!Order_clientId_fkey(prenom)')
      .eq('freelanceId', userId)
      .order('createdAt', { ascending: false }),
    sb.from('Profile').select('soldeDisponible, totalGagne').eq('userId', userId).maybeSingle(),
    sb.from('User').select('telephoneMomo, operateurMomo').eq('id', userId).maybeSingle(),
  ]);

  type FRow = {
    id: string; titre: string; montant: number; statut: string; createdAt: string;
    client: { prenom: string } | null;
  };
  const data: FreelanceOrder[] = ((orders as unknown as FRow[]) ?? []).map((o) => ({
    id: o.id,
    titre: o.titre,
    client: o.client?.prenom ?? '—',
    montant: o.montant,
    date: o.createdAt,
    statut: o.statut as FreelanceOrder['statut'],
  }));

  // Solde "en attente de validation" = commandes payées non encore validées (séquestre).
  const enAttente = data
    .filter((o) => o.statut === 'EN_COURS' || o.statut === 'LIVREE')
    .reduce((s, o) => s + o.montant, 0);

  return (
    <DashboardClient
      role="FREELANCE"
      prenom={session.user.prenom}
      freelanceOrders={data}
      solde={profile?.soldeDisponible ?? 0}
      enAttente={enAttente}
      gagne={profile?.totalGagne ?? 0}
      momo={{ numero: user?.telephoneMomo ?? '', operateur: user?.operateurMomo ?? '' }}
    />
  );
}
