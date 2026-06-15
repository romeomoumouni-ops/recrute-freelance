import { supabaseAdmin } from '@/lib/supabase';
import { bictorysConfigured } from '@/lib/bictorys';
import { dateCourte, heureCourte } from '@/lib/utils';
import BictorysTestButton from '@/components/admin/BictorysTestButton';

export const dynamic = 'force-dynamic';

export default async function BictorysTestPage() {
  const configured = bictorysConfigured();

  const { data: logs } = await supabaseAdmin()
    .from('WebhookLog')
    .select('id, source, payload, createdAt')
    .in('source', ['bictorys', 'bictorys-charge'])
    .order('createdAt', { ascending: false })
    .limit(30);

  type Row = { id: string; source: string; payload: Record<string, unknown>; createdAt: string };
  const list = (logs as Row[]) ?? [];

  return (
    <>
      <h1 className="admin-h1">Test paiement Bictorys (sandbox)</h1>
      <p className="admin-sub">
        Crée un paiement de test via Bictorys, en parallèle de Chariow. Après paiement, l’événement
        du webhook apparaît ci-dessous — c’est la preuve qu’un paiement passe.
      </p>

      {!configured && (
        <div className="verif-banner" style={{ background: '#fdecea', color: '#c0392b', marginBottom: 18 }}>
          <span>
            <strong>Configuration requise.</strong> Ajoute dans les variables d’environnement Vercel :
            <br />• <code>BICTORYS_API_KEY</code> (clé de test)
            <br />• <code>BICTORYS_WEBHOOK_SECRET</code> (même valeur que dans le dashboard Bictorys)
            <br />• (optionnel) <code>BICTORYS_PAYMENT_TYPE</code>, <code>BICTORYS_BASE_URL</code>
            <br />Et règle l’URL du webhook Bictorys sur :{' '}
            <code>https://www.recrutefreelance.com/api/bictorys/webhook</code>
          </span>
        </div>
      )}

      <BictorysTestButton disabled={!configured} />

      <h2 className="admin-h2">Derniers événements</h2>
      {list.length === 0 ? (
        <div className="admin-empty">Aucun événement pour l’instant. Lance un paiement de test.</div>
      ) : (
        <div className="admin-cards">
          {list.map((l) => {
            const p = l.payload || {};
            const statut = (p.status as string) || (p.ok === true ? 'charge créée' : p.ok === false ? 'échec création' : '—');
            const isWebhook = l.source === 'bictorys';
            const ok = statut === 'succeeded' || p.ok === true;
            return (
              <div className={`admin-card${ok ? '' : ' hot'}`} key={l.id}>
                <div className="admin-card-main">
                  <strong>{isWebhook ? '📨 Webhook' : '➡️ Création'}</strong>{' '}
                  <span className="status gray">{statut}</span>
                  <div className="admin-meta" style={{ marginTop: 4 }}>
                    réf : {(p.paymentReference as string) || '—'}
                    {p.amount != null && <> · {String(p.amount)} {String(p.currency ?? '')}</>}
                    {p.amountEur != null && <> · {String(p.amountEur)} €</>}
                    {p.error != null && <> · <span style={{ color: '#c0392b' }}>{String(p.error)}</span></>}
                    {' · '}{dateCourte(l.createdAt)} {heureCourte(l.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
