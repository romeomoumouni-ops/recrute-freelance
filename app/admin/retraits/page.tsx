import { supabaseAdmin } from '@/lib/supabase';
import AdminWithdrawalsView, { type AdminWithdrawalRow } from '@/components/admin/AdminWithdrawalsView';

export const dynamic = 'force-dynamic';

export default async function AdminRetraits() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from('Withdrawal')
    .select('id, montant, operateur, numero, statut, createdAt, freelanceId')
    .order('createdAt', { ascending: false })
    .limit(200);

  type W = { id: string; montant: number; operateur: string; numero: string; statut: string; createdAt: string; freelanceId: string };
  const list = (rows as W[]) ?? [];
  const ids = [...new Set(list.map((w) => w.freelanceId))];
  const { data: users } = ids.length ? await sb.from('User').select('id, prenom, email').in('id', ids) : { data: [] };
  const byId = new Map((users as { id: string; prenom: string; email: string }[] ?? []).map((u) => [u.id, u]));

  const data: AdminWithdrawalRow[] = list.map((w) => ({
    id: w.id, montant: w.montant, operateur: w.operateur, numero: w.numero,
    statut: w.statut, createdAt: w.createdAt,
    prenom: byId.get(w.freelanceId)?.prenom ?? '—',
    email: byId.get(w.freelanceId)?.email ?? '',
  }));

  return (
    <>
      <h1 className="admin-h1">Retraits Mobile Money</h1>
      <p className="admin-sub">
        Envoie le montant via Mobile Money au numéro indiqué, puis marque « Envoyé ». « Rejeter »
        rembourse le solde du freelance.
      </p>
      <AdminWithdrawalsView rows={data} />
    </>
  );
}
