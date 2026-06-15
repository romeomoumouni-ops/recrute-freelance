import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { euros, dateCourte, heureCourte } from '@/lib/utils';
import { OPERATEUR_LABEL } from '@/lib/constants';
import AdminButton from '@/components/admin/AdminButton';
import AdminValidationActions from '@/components/admin/AdminValidationActions';
import { getConversationsForUser } from '@/lib/admin-conversations';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const sb = supabaseAdmin();

  const { data: user } = await sb
    .from('User')
    .select('id, prenom, email, role, banni, pays, telephoneMomo, operateurMomo, createdAt')
    .eq('id', id)
    .maybeSingle();
  if (!user) notFound();
  const u = user as {
    id: string; prenom: string; email: string; role: string; banni: boolean;
    pays: string | null; telephoneMomo: string | null; operateurMomo: string | null; createdAt: string;
  };
  const isFreelance = u.role === 'FREELANCE';

  const [{ data: profile }, { data: asClient }, { data: asFreelance }, { data: withdrawals }] = await Promise.all([
    isFreelance
      ? sb.from('Profile').select('titre, bio, note, photoUrl, estVerifie, statutValidation, motifRejet, soldeDisponible, totalGagne').eq('userId', id).maybeSingle()
      : Promise.resolve({ data: null }),
    sb.from('Order').select('id, titre, montant, statut, createdAt').eq('clientId', id).order('createdAt', { ascending: false }).limit(30),
    isFreelance
      ? sb.from('Order').select('id, titre, montant, statut, createdAt').eq('freelanceId', id).order('createdAt', { ascending: false }).limit(30)
      : Promise.resolve({ data: [] }),
    isFreelance
      ? sb.from('Withdrawal').select('id, montant, statut, createdAt, numero').eq('freelanceId', id).order('createdAt', { ascending: false }).limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  const p = profile as { titre: string | null; bio: string | null; note: string | null; photoUrl: string | null; estVerifie: boolean; statutValidation: string | null; motifRejet: string | null; soldeDisponible: number; totalGagne: number } | null;
  type O = { id: string; titre: string; montant: number; statut: string; createdAt: string };
  const orders = [...((asClient as O[]) ?? []), ...((asFreelance as O[]) ?? [])];
  type W = { id: string; montant: number; statut: string; createdAt: string; numero: string };
  const wds = (withdrawals as W[]) ?? [];

  const conversations = await getConversationsForUser(id);

  return (
    <>
      <Link href="/admin/utilisateurs" className="admin-back">← Tous les utilisateurs</Link>
      <h1 className="admin-h1">
        {u.prenom}{' '}
        {u.banni && <span className="status red">banni</span>}{' '}
        {isFreelance && p?.statutValidation === 'APPROUVE' && <span className="status green">approuvé</span>}
        {isFreelance && p?.statutValidation === 'EN_ATTENTE' && <span className="status">validation en attente</span>}
        {isFreelance && p?.statutValidation === 'REJETE' && <span className="status red">validation refusée</span>}
      </h1>
      <p className="admin-sub">{u.role === 'FREELANCE' ? 'Freelance' : 'Client'} · inscrit le {dateCourte(u.createdAt)}</p>

      <div className="admin-detail-grid">
        <div className="admin-panel">
          <h2 className="admin-h2" style={{ marginTop: 0 }}>Coordonnées</h2>
          <div className="admin-kv"><span>E-mail</span><strong>{u.email}</strong></div>
          {u.pays && <div className="admin-kv"><span>Pays</span><strong>{u.pays}</strong></div>}
          {u.telephoneMomo && <div className="admin-kv"><span>Mobile Money</span><strong>{u.telephoneMomo} · {u.operateurMomo ? OPERATEUR_LABEL[u.operateurMomo] : ''}</strong></div>}
          {isFreelance && p && (
            <>
              <div className="admin-kv"><span>Solde disponible</span><strong>{euros(p.soldeDisponible)}</strong></div>
              <div className="admin-kv"><span>Total gagné</span><strong>{euros(p.totalGagne)}</strong></div>
              <div className="admin-kv"><span>Titre</span><strong>{p.titre || '—'}</strong></div>
            </>
          )}
        </div>

        <div className="admin-panel">
          <h2 className="admin-h2" style={{ marginTop: 0 }}>Actions</h2>
          {isFreelance && p?.statutValidation === 'EN_ATTENTE' && (
            <div style={{ marginBottom: 12 }}>
              <div className="admin-meta" style={{ marginBottom: 6 }}>Demande de validation en attente :</div>
              <AdminValidationActions userId={u.id} prenom={u.prenom} />
            </div>
          )}
          <div className="admin-card-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <AdminButton endpoint="/api/admin/user" body={{ id: u.id, action: u.banni ? 'unban' : 'ban' }}
              label={u.banni ? 'Débannir le compte' : '🚫 Bannir le compte'}
              className={u.banni ? 'btn btn-outline btn-sm' : 'btn btn-dark btn-sm'}
              confirmMsg={u.banni ? undefined : `Bannir ${u.prenom} ?`} successMsg="Mis à jour." />
            {isFreelance && (
              <AdminButton endpoint="/api/admin/user" body={{ id: u.id, action: p?.estVerifie ? 'unverify' : 'verify' }}
                label={p?.estVerifie ? 'Retirer le badge vérifié' : 'Vérifier le freelance'}
                className="btn btn-outline btn-sm" successMsg="Mis à jour." />
            )}
            {isFreelance && p?.photoUrl && (
              <AdminButton endpoint="/api/admin/profile" body={{ userId: u.id, action: 'clearPhoto' }}
                label="Vider la photo" className="btn btn-outline btn-sm"
                confirmMsg="Supprimer la photo de profil ?" successMsg="Photo supprimée." />
            )}
            {isFreelance && p?.bio && (
              <AdminButton endpoint="/api/admin/profile" body={{ userId: u.id, action: 'clearBio' }}
                label="Vider la bio" className="btn btn-outline btn-sm"
                confirmMsg="Supprimer la bio ?" successMsg="Bio supprimée." />
            )}
          </div>
        </div>
      </div>

      {isFreelance && wds.length > 0 && (
        <>
          <h2 className="admin-h2">Retraits</h2>
          <div className="table-wrap"><table>
            <thead><tr><th>Montant</th><th>Numéro</th><th>Statut</th><th>Date</th></tr></thead>
            <tbody>{wds.map((w) => (
              <tr key={w.id}><td data-label="Montant">{euros(w.montant)}</td><td data-label="Numéro">{w.numero}</td>
              <td data-label="Statut"><span className="status gray">{w.statut}</span></td><td data-label="Date">{dateCourte(w.createdAt)}</td></tr>
            ))}</tbody>
          </table></div>
        </>
      )}

      <h2 className="admin-h2">Conversations ({conversations.length})</h2>
      {conversations.length === 0 ? (
        <div className="admin-empty">Aucune conversation.</div>
      ) : (
        <div className="admin-cards">
          {conversations.map((c) => (
            <Link key={c.id} href={`/admin/conversations/${c.id}`} className={`admin-card${c.flaggedCount ? ' hot' : ''}`}>
              <div className="admin-card-main">
                <strong>Avec {c.withName}</strong>{' '}
                <span className="admin-meta">({c.withEmail})</span>
                <div className="admin-meta" style={{ marginTop: 4 }}>
                  « {c.lastContenu.length > 90 ? c.lastContenu.slice(0, 90) + '…' : c.lastContenu} »
                </div>
                <div className="admin-meta" style={{ marginTop: 2 }}>
                  {c.total} message{c.total > 1 ? 's' : ''}
                  {c.flaggedCount > 0 && <> · <strong style={{ color: '#c0392b' }}>{c.flaggedCount} signalé{c.flaggedCount > 1 ? 's' : ''}</strong></>}
                  {c.lastAt && <> · {dateCourte(c.lastAt)} {heureCourte(c.lastAt)}</>}
                </div>
              </div>
              <span className="btn btn-outline btn-sm">Lire le chat →</span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="admin-h2">Commandes ({orders.length})</h2>
      {orders.length === 0 ? (
        <div className="admin-empty">Aucune commande.</div>
      ) : (
        <div className="table-wrap"><table>
          <thead><tr><th>Mission</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.id}><td data-label="Mission"><strong>{o.titre}</strong></td><td data-label="Montant">{euros(o.montant)}</td>
            <td data-label="Statut"><span className="status gray">{o.statut}</span></td><td data-label="Date">{dateCourte(o.createdAt)}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
