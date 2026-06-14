import { supabaseAdmin } from '@/lib/supabase';
import { euros, fcfa, dateCourte } from '@/lib/utils';
import { OPERATEUR_LABEL, TAUX_FCFA } from '@/lib/constants';
import AdminButton from '@/components/admin/AdminButton';

export const dynamic = 'force-dynamic';

export default async function AdminRetraits() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from('Withdrawal')
    .select('id, montant, operateur, numero, statut, createdAt, freelanceId')
    .order('createdAt', { ascending: false })
    .limit(100);

  type W = { id: string; montant: number; operateur: string; numero: string; statut: string; createdAt: string; freelanceId: string };
  const list = (rows as W[]) ?? [];
  const ids = [...new Set(list.map((w) => w.freelanceId))];
  const { data: users } = ids.length
    ? await sb.from('User').select('id, prenom, email').in('id', ids)
    : { data: [] };
  const byId = new Map((users as { id: string; prenom: string; email: string }[] ?? []).map((u) => [u.id, u]));

  const enAttente = list.filter((w) => w.statut === 'EN_ATTENTE');

  return (
    <>
      <h1 className="admin-h1">Retraits Mobile Money</h1>
      <p className="admin-sub">
        Envoie le montant via Mobile Money au numéro indiqué, puis marque « Envoyé ». « Rejeter »
        rembourse le solde du freelance.
      </p>

      <h2 className="admin-h2">À traiter ({enAttente.length})</h2>
      {enAttente.length === 0 ? (
        <div className="admin-empty">Aucun retrait en attente. 🎉</div>
      ) : (
        <div className="admin-cards">
          {enAttente.map((w) => {
            const u = byId.get(w.freelanceId);
            return (
              <div className="admin-card hot" key={w.id}>
                <div className="admin-card-main">
                  <div className="admin-amount">{euros(w.montant)} <span>≈ {fcfa(Math.round(w.montant * TAUX_FCFA))}</span></div>
                  <div className="admin-meta">
                    <strong>{u?.prenom ?? '—'}</strong> · {u?.email ?? ''}<br />
                    📱 <strong>{w.numero}</strong> · {OPERATEUR_LABEL[w.operateur] ?? w.operateur}<br />
                    <span className="admin-date">Demandé le {dateCourte(w.createdAt)}</span>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <AdminButton
                    endpoint="/api/admin/withdrawal"
                    body={{ id: w.id, action: 'settle' }}
                    label="✓ Marquer envoyé"
                    className="btn btn-dark btn-sm"
                    confirmMsg={`Confirmer : ${euros(w.montant)} envoyés sur ${w.numero} ?`}
                    successMsg="Retrait marqué comme envoyé."
                  />
                  <AdminButton
                    endpoint="/api/admin/withdrawal"
                    body={{ id: w.id, action: 'reject' }}
                    label="Rejeter (rembourser)"
                    className="btn btn-outline btn-sm"
                    confirmMsg="Rejeter ce retrait et recréditer le solde du freelance ?"
                    successMsg="Retrait rejeté, solde recrédité."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="admin-h2">Historique récent</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Freelance</th><th>Montant</th><th>Numéro</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody>
            {list.filter((w) => w.statut !== 'EN_ATTENTE').slice(0, 40).map((w) => {
              const u = byId.get(w.freelanceId);
              return (
                <tr key={w.id}>
                  <td data-label="Freelance">{u?.prenom ?? '—'}</td>
                  <td data-label="Montant">{euros(w.montant)}</td>
                  <td data-label="Numéro">{w.numero}</td>
                  <td data-label="Statut"><span className={`status ${w.statut === 'EFFECTUE' ? 'green' : 'gray'}`}>{w.statut}</span></td>
                  <td data-label="Date">{dateCourte(w.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
