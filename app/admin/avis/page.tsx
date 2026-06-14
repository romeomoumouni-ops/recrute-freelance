import { supabaseAdmin } from '@/lib/supabase';
import { dateCourte } from '@/lib/utils';
import AdminButton from '@/components/admin/AdminButton';

export const dynamic = 'force-dynamic';

export default async function AdminAvis() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from('Review')
    .select('id, note, commentaire, createdAt, authorId, orderId')
    .order('createdAt', { ascending: false })
    .limit(100);

  type R = { id: string; note: number; commentaire: string | null; createdAt: string; authorId: string; orderId: string };
  const list = (rows as R[]) ?? [];

  const orderIds = [...new Set(list.map((r) => r.orderId))];
  const { data: orders } = orderIds.length
    ? await sb.from('Order').select('id, titre, freelanceId').in('id', orderIds)
    : { data: [] };
  const ordById = new Map((orders as { id: string; titre: string; freelanceId: string }[] ?? []).map((o) => [o.id, o]));

  const userIds = [...new Set([...list.map((r) => r.authorId), ...(orders as { freelanceId: string }[] ?? []).map((o) => o.freelanceId)])];
  const { data: users } = userIds.length ? await sb.from('User').select('id, prenom').in('id', userIds) : { data: [] };
  const nameById = new Map((users as { id: string; prenom: string }[] ?? []).map((u) => [u.id, u.prenom]));

  return (
    <>
      <h1 className="admin-h1">Modération des avis</h1>
      <p className="admin-sub">Supprime un avis abusif, mensonger ou contenant des coordonnées.</p>

      {list.length === 0 ? (
        <div className="admin-empty">Aucun avis pour le moment.</div>
      ) : (
        <div className="admin-cards">
          {list.map((r) => {
            const o = ordById.get(r.orderId);
            return (
              <div className="admin-card" key={r.id}>
                <div className="admin-card-main">
                  <div className="admin-meta">
                    <strong>{'★'.repeat(r.note)}{'☆'.repeat(5 - r.note)}</strong> ·{' '}
                    {nameById.get(r.authorId) ?? 'Client'} → {o ? nameById.get(o.freelanceId) ?? '—' : '—'}{' '}
                    <span className="admin-date">· {dateCourte(r.createdAt)}</span>
                  </div>
                  {r.commentaire && <div className="admin-quote">« {r.commentaire} »</div>}
                </div>
                <div className="admin-card-actions">
                  <AdminButton endpoint="/api/admin/review" body={{ id: r.id, action: 'delete' }}
                    label="Supprimer l'avis" className="btn btn-dark btn-sm"
                    confirmMsg="Supprimer définitivement cet avis ?" successMsg="Avis supprimé." />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
