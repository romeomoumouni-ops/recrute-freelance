import { supabaseAdmin } from '@/lib/supabase';
import { dateCourte, heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminJournal() {
  const { data } = await supabaseAdmin()
    .from('AdminLog')
    .select('id, adminPrenom, action, cible, createdAt')
    .order('createdAt', { ascending: false })
    .limit(200);

  type L = { id: string; adminPrenom: string | null; action: string; cible: string | null; createdAt: string };
  const list = (data as L[]) ?? [];

  return (
    <>
      <h1 className="admin-h1">Journal d&apos;audit</h1>
      <p className="admin-sub">Historique des 200 dernières actions effectuées dans l&apos;espace admin.</p>

      {list.length === 0 ? (
        <div className="admin-empty">Aucune action enregistrée pour le moment.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Quand</th><th>Admin</th><th>Action</th><th>Cible</th></tr></thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id}>
                  <td data-label="Quand">{dateCourte(l.createdAt)} · {heureCourte(l.createdAt)}</td>
                  <td data-label="Admin">{l.adminPrenom ?? '—'}</td>
                  <td data-label="Action"><strong>{l.action}</strong></td>
                  <td data-label="Cible">{l.cible ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
