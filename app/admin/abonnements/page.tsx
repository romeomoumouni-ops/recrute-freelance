import { supabaseAdmin } from '@/lib/supabase';
import { ABONNEMENT_FCFA, TAUX_FCFA } from '@/lib/constants';
import { fcfa, euros, dateCourte, heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminAbonnements() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('AbonnementPayment')
    .select('id, userId, email, validUntil, createdAt, user:User(prenom)')
    .order('createdAt', { ascending: false })
    .limit(1000);

  type Row = {
    id: string;
    userId: string;
    email: string | null;
    validUntil: string | null;
    createdAt: string;
    user: { prenom: string } | { prenom: string }[] | null;
  };
  const rows = (data as unknown as Row[]) ?? [];
  const prenomOf = (r: Row) => (Array.isArray(r.user) ? r.user[0]?.prenom : r.user?.prenom) ?? '—';

  const n = rows.length;
  const totalFcfa = n * ABONNEMENT_FCFA;
  const totalEur = Math.round(totalFcfa / TAUX_FCFA);
  const distinct = new Set(rows.map((r) => r.userId)).size;

  // Collecté ce mois-ci (mois calendaire en cours).
  const now = new Date();
  const startMonthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const nMonth = rows.filter((r) => new Date(r.createdAt).getTime() >= startMonthMs).length;
  const moisFcfa = nMonth * ABONNEMENT_FCFA;

  return (
    <>
      <h1 className="admin-h1">Abonnements</h1>
      <p className="admin-sub">
        Montant collecté sur les abonnements freelances. Chaque paiement correspond à 1 mois à{' '}
        <strong>{fcfa(ABONNEMENT_FCFA)}</strong>.
      </p>

      <div className="admin-kpis">
        <div className="admin-kpi">
          <div className="v">{fcfa(totalFcfa)}</div>
          <div className="k">Montant total collecté (≈ {euros(totalEur)})</div>
        </div>
        <div className="admin-kpi">
          <div className="v">{fcfa(moisFcfa)}</div>
          <div className="k">Collecté ce mois-ci</div>
        </div>
        <div className="admin-kpi">
          <div className="v">{n}</div>
          <div className="k">Paiements d&apos;abonnement</div>
        </div>
        <div className="admin-kpi">
          <div className="v">{distinct}</div>
          <div className="k">Abonnés (uniques)</div>
        </div>
      </div>

      <h2 className="admin-h2">Historique des paiements ({n})</h2>
      {n === 0 ? (
        <div className="admin-empty">Aucun paiement d&apos;abonnement pour le moment.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Freelance</th>
                <th>E-mail</th>
                <th>Montant</th>
                <th>Payé le</th>
                <th>Accès jusqu&apos;au</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Freelance"><strong>{prenomOf(r)}</strong></td>
                  <td data-label="E-mail">{r.email ?? '—'}</td>
                  <td data-label="Montant">{fcfa(ABONNEMENT_FCFA)}</td>
                  <td data-label="Payé le">{dateCourte(r.createdAt)} {heureCourte(r.createdAt)}</td>
                  <td data-label="Accès jusqu'au">{r.validUntil ? dateCourte(r.validUntil) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
