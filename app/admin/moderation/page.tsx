import { supabaseAdmin } from '@/lib/supabase';
import { dateCourte } from '@/lib/utils';
import AdminButton from '@/components/admin/AdminButton';

export const dynamic = 'force-dynamic';

export default async function AdminModeration() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from('Message')
    .select('id, contenu, flagReason, createdAt, senderId, conversationId')
    .eq('flagged', true)
    .order('createdAt', { ascending: false })
    .limit(100);

  type M = { id: string; contenu: string; flagReason: string | null; createdAt: string; senderId: string; conversationId: string };
  const list = (rows as M[]) ?? [];
  const ids = [...new Set(list.map((m) => m.senderId))];
  const { data: users } = ids.length ? await sb.from('User').select('id, prenom, email, banni').in('id', ids) : { data: [] };
  const byId = new Map((users as { id: string; prenom: string; email: string; banni: boolean }[] ?? []).map((u) => [u.id, u]));

  return (
    <>
      <h1 className="admin-h1">Modération</h1>
      <p className="admin-sub">
        Messages signalés comme tentative de contact hors plateforme. « Traité » retire le message de
        la file ; « Bannir » bloque l&apos;expéditeur.
      </p>

      {list.length === 0 ? (
        <div className="admin-empty">Aucun message signalé. ✅</div>
      ) : (
        <div className="admin-cards">
          {list.map((m) => {
            const u = byId.get(m.senderId);
            return (
              <div className="admin-card hot" key={m.id}>
                <div className="admin-card-main">
                  <div className="admin-meta">
                    <strong>{u?.prenom ?? '—'}</strong> · {u?.email ?? ''}{' '}
                    {u?.banni && <span className="status red">banni</span>}<br />
                    <span className="admin-flagreason">🚩 {m.flagReason}</span>{' '}
                    <span className="admin-date">· {dateCourte(m.createdAt)}</span>
                  </div>
                  <div className="admin-quote">« {m.contenu} »</div>
                </div>
                <div className="admin-card-actions">
                  <AdminButton endpoint="/api/admin/message" body={{ id: m.id, action: 'dismiss' }}
                    label="✓ Traité" className="btn btn-outline btn-sm" successMsg="Retiré de la file." />
                  {!u?.banni && (
                    <AdminButton endpoint="/api/admin/user" body={{ id: m.senderId, action: 'ban' }}
                      label="🚫 Bannir l'expéditeur" className="btn btn-dark btn-sm"
                      confirmMsg={`Bannir ${u?.prenom ?? 'cet utilisateur'} ? Il ne pourra plus utiliser la plateforme.`}
                      successMsg="Utilisateur banni." />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
