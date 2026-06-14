import { supabaseAdmin } from '@/lib/supabase';
import { dateCourte } from '@/lib/utils';
import AdminButton from '@/components/admin/AdminButton';

export const dynamic = 'force-dynamic';

export default async function AdminUtilisateurs() {
  const sb = supabaseAdmin();
  const [{ data: users }, { data: profiles }] = await Promise.all([
    sb.from('User').select('id, prenom, email, role, banni, createdAt, pays').order('createdAt', { ascending: false }).limit(200),
    sb.from('Profile').select('userId, estVerifie'),
  ]);

  type U = { id: string; prenom: string; email: string; role: string; banni: boolean; createdAt: string; pays: string | null };
  const verif = new Map((profiles as { userId: string; estVerifie: boolean }[] ?? []).map((p) => [p.userId, p.estVerifie]));
  const list = (users as U[]) ?? [];

  return (
    <>
      <h1 className="admin-h1">Utilisateurs ({list.length})</h1>
      <p className="admin-sub">Bannir bloque l&apos;accès à toute la plateforme. Vérifier attribue le badge « Freelance approuvé ».</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Statut</th><th>Inscrit</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td data-label="Nom"><strong>{u.prenom}</strong>{u.pays ? ` · ${u.pays}` : ''}</td>
                <td data-label="E-mail">{u.email}</td>
                <td data-label="Rôle">{u.role === 'FREELANCE' ? 'Freelance' : 'Client'}</td>
                <td data-label="Statut">
                  {u.banni && <span className="status red">banni</span>}
                  {u.role === 'FREELANCE' && !u.banni && (
                    <span className={`status ${verif.get(u.id) ? 'green' : 'gray'}`}>
                      {verif.get(u.id) ? 'vérifié' : 'non vérifié'}
                    </span>
                  )}
                </td>
                <td data-label="Inscrit">{dateCourte(u.createdAt)}</td>
                <td data-label="Actions" className="td-action">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {u.role === 'FREELANCE' && (
                      <AdminButton endpoint="/api/admin/user"
                        body={{ id: u.id, action: verif.get(u.id) ? 'unverify' : 'verify' }}
                        label={verif.get(u.id) ? 'Retirer badge' : 'Vérifier'}
                        className="btn btn-outline btn-sm" successMsg="Mis à jour." />
                    )}
                    <AdminButton endpoint="/api/admin/user"
                      body={{ id: u.id, action: u.banni ? 'unban' : 'ban' }}
                      label={u.banni ? 'Débannir' : 'Bannir'}
                      className={u.banni ? 'btn btn-outline btn-sm' : 'btn btn-dark btn-sm'}
                      confirmMsg={u.banni ? undefined : `Bannir ${u.prenom} ?`} successMsg="Mis à jour." />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
