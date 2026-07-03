import { supabaseAdmin } from '@/lib/supabase';
import { ABONNEMENT_FCFA, TAUX_FCFA } from '@/lib/constants';
import { fcfa, euros, dateCourte, heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminAbonnements() {
  const sb = supabaseAdmin();

  const [{ data: recus }, { data: matched }] = await Promise.all([
    // Tous les paiements d'abonnement RÉELLEMENT reçus (webhook Chariow), rattachés ou non.
    sb.from('abonnement_paiements_recus').select('sale_id, email, recu_le, rattache').order('recu_le', { ascending: false }).limit(2000),
    // Paiements rattachés à un compte (avec le nom du freelance).
    sb.from('AbonnementPayment').select('id, userId, email, validUntil, createdAt, user:User(prenom)').order('createdAt', { ascending: false }).limit(1000),
  ]);

  type Recu = { sale_id: string; email: string | null; recu_le: string; rattache: boolean };
  const allRecus = (recus as Recu[]) ?? [];
  const nonRattaches = allRecus.filter((r) => !r.rattache);

  type Row = { id: string; userId: string; email: string | null; validUntil: string | null; createdAt: string; user: { prenom: string } | { prenom: string }[] | null };
  const rows = (matched as unknown as Row[]) ?? [];
  const prenomOf = (r: Row) => (Array.isArray(r.user) ? r.user[0]?.prenom : r.user?.prenom) ?? '—';

  const nRecus = allRecus.length; // vrai nombre de paiements encaissés
  const totalFcfa = nRecus * ABONNEMENT_FCFA;
  const totalEur = Math.round(totalFcfa / TAUX_FCFA);
  const distinct = new Set(rows.map((r) => r.userId)).size;

  const now = new Date();
  const startMonthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const nMonth = allRecus.filter((r) => new Date(r.recu_le).getTime() >= startMonthMs).length;
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
          <div className="k">Montant total encaissé (≈ {euros(totalEur)})</div>
        </div>
        <div className="admin-kpi">
          <div className="v">{fcfa(moisFcfa)}</div>
          <div className="k">Encaissé ce mois-ci</div>
        </div>
        <div className="admin-kpi">
          <div className="v">{nRecus}</div>
          <div className="k">Paiements reçus</div>
        </div>
        <div className="admin-kpi">
          <div className="v">{distinct}</div>
          <div className="k">Abonnés rattachés (uniques)</div>
        </div>
      </div>

      {nonRattaches.length > 0 && (
        <>
          <h2 className="admin-h2" style={{ color: '#c0392b' }}>
            ⚠️ Paiements non rattachés ({nonRattaches.length})
          </h2>
          <p className="admin-sub" style={{ marginTop: -6 }}>
            Ces personnes ont payé mais avec un e-mail qui ne correspond à <strong>aucun compte</strong> du
            site : le paiement est bien encaissé (et compté ci-dessus), mais impossible à attribuer
            automatiquement. Retrouve la personne, puis réactive son compte manuellement depuis sa fiche.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>E-mail du payeur</th><th>Payé le</th><th>Montant</th></tr>
              </thead>
              <tbody>
                {nonRattaches.map((r) => (
                  <tr key={r.sale_id}>
                    <td data-label="E-mail"><strong>{r.email ?? '—'}</strong></td>
                    <td data-label="Payé le">{dateCourte(r.recu_le)} {heureCourte(r.recu_le)}</td>
                    <td data-label="Montant">{fcfa(ABONNEMENT_FCFA)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="admin-h2">Paiements rattachés ({rows.length})</h2>
      {rows.length === 0 ? (
        <div className="admin-empty">Aucun paiement rattaché pour le moment.</div>
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
