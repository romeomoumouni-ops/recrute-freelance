import { supabaseAdmin } from '@/lib/supabase';
import { euros, dateCourte } from '@/lib/utils';
import AdminButton from '@/components/admin/AdminButton';
import AdminOrdersTable from '@/components/admin/AdminOrdersTable';

export const dynamic = 'force-dynamic';

export default async function AdminLitiges() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from('Order')
    .select('id, titre, montant, commission, statut, createdAt, clientId, freelanceId')
    .order('createdAt', { ascending: false })
    .limit(120);

  type O = { id: string; titre: string; montant: number; commission: number; statut: string; createdAt: string; clientId: string; freelanceId: string };
  const list = (rows as O[]) ?? [];
  const ids = [...new Set(list.flatMap((o) => [o.clientId, o.freelanceId]))];
  const { data: users } = ids.length ? await sb.from('User').select('id, prenom').in('id', ids) : { data: [] };
  const byId = new Map((users as { id: string; prenom: string }[] ?? []).map((u) => [u.id, u.prenom]));

  const enCours = list.filter((o) => o.statut === 'EN_COURS' || o.statut === 'LIVREE');

  return (
    <>
      <h1 className="admin-h1">Commandes &amp; litiges</h1>
      <p className="admin-sub">
        En cas de litige : « Libérer » verse les fonds au freelance, « Rembourser » annule la
        commande (le remboursement carte se fait ensuite à la main dans Chariow).
      </p>

      <h2 className="admin-h2">En cours / livrées ({enCours.length})</h2>
      {enCours.length === 0 ? (
        <div className="admin-empty">Aucune commande en cours.</div>
      ) : (
        <div className="admin-cards">
          {enCours.map((o) => (
            <div className="admin-card" key={o.id}>
              <div className="admin-card-main">
                <div className="admin-amount">{euros(o.montant)} <span>net freelance</span></div>
                <div className="admin-meta">
                  <strong>{o.titre}</strong><br />
                  Client : {byId.get(o.clientId) ?? '—'} · Freelance : {byId.get(o.freelanceId) ?? '—'}<br />
                  <span className={`status ${o.statut === 'LIVREE' ? 'orange' : 'gray'}`}>{o.statut}</span>{' '}
                  <span className="admin-date">· {dateCourte(o.createdAt)}</span>
                </div>
              </div>
              <div className="admin-card-actions">
                <AdminButton endpoint="/api/admin/order" body={{ id: o.id, action: 'release' }}
                  label="Libérer au freelance" className="btn btn-dark btn-sm"
                  confirmMsg={`Verser ${euros(o.montant)} au freelance ?`} successMsg="Fonds libérés au freelance." />
                <AdminButton endpoint="/api/admin/order" body={{ id: o.id, action: 'refund' }}
                  label="Rembourser / annuler" className="btn btn-outline btn-sm"
                  confirmMsg="Annuler la commande (remboursement carte à faire dans Chariow) ?" successMsg="Commande annulée." />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="admin-h2">Toutes les commandes</h2>
      <AdminOrdersTable
        orders={list.map((o) => ({
          id: o.id,
          titre: o.titre,
          montant: o.montant,
          statut: o.statut,
          createdAt: o.createdAt,
          client: byId.get(o.clientId) ?? '—',
          freelance: byId.get(o.freelanceId) ?? '—',
        }))}
      />
    </>
  );
}
