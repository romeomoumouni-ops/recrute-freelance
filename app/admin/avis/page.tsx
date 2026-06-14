import { supabaseAdmin } from '@/lib/supabase';
import AdminReviewsView, { type AdminReviewRow } from '@/components/admin/AdminReviewsView';

export const dynamic = 'force-dynamic';

export default async function AdminAvis() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from('Review')
    .select('id, note, commentaire, createdAt, authorId, orderId')
    .order('createdAt', { ascending: false })
    .limit(200);

  type R = { id: string; note: number; commentaire: string | null; createdAt: string; authorId: string; orderId: string };
  const list = (rows as R[]) ?? [];

  const orderIds = [...new Set(list.map((r) => r.orderId))];
  const { data: orders } = orderIds.length
    ? await sb.from('Order').select('id, freelanceId').in('id', orderIds)
    : { data: [] };
  const ordById = new Map((orders as { id: string; freelanceId: string }[] ?? []).map((o) => [o.id, o.freelanceId]));

  const userIds = [...new Set([...list.map((r) => r.authorId), ...(orders as { freelanceId: string }[] ?? []).map((o) => o.freelanceId)])];
  const { data: users } = userIds.length ? await sb.from('User').select('id, prenom').in('id', userIds) : { data: [] };
  const nameById = new Map((users as { id: string; prenom: string }[] ?? []).map((u) => [u.id, u.prenom]));

  const data: AdminReviewRow[] = list.map((r) => ({
    id: r.id, note: r.note, commentaire: r.commentaire, createdAt: r.createdAt,
    author: nameById.get(r.authorId) ?? 'Client',
    freelance: nameById.get(ordById.get(r.orderId) ?? '') ?? '—',
  }));

  return (
    <>
      <h1 className="admin-h1">Modération des avis</h1>
      <p className="admin-sub">Supprime un avis abusif, mensonger ou contenant des coordonnées.</p>
      <AdminReviewsView reviews={data} />
    </>
  );
}
