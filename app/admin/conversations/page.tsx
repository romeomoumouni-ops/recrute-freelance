import Link from 'next/link';
import { getAllConversations } from '@/lib/admin-conversations';
import { dateCourte, heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminConversations() {
  const convs = await getAllConversations();
  const flagues = convs.filter((c) => c.flaggedCount > 0).length;

  return (
    <>
      <h1 className="admin-h1">Messagerie</h1>
      <p className="admin-sub">
        Toutes les conversations de la plateforme, les plus récentes en haut. Clique pour lire le fil
        complet (lecture seule).{flagues > 0 && <> <strong style={{ color: '#c0392b' }}>{flagues} conversation(s) avec un message signalé.</strong></>}
      </p>

      {convs.length === 0 ? (
        <div className="admin-empty">Aucune conversation pour le moment.</div>
      ) : (
        <div className="admin-cards">
          {convs.map((c) => (
            <Link key={c.id} href={`/admin/conversations/${c.id}`} className={`admin-card${c.flaggedCount ? ' hot' : ''}`}>
              <div className="admin-card-main">
                <strong>{c.clientNom}</strong>{' '}
                <span className="admin-meta">({c.clientEmail})</span>{' '}
                <span className="admin-meta">↔</span>{' '}
                <strong>{c.freelanceNom}</strong>{' '}
                <span className="admin-meta">({c.freelanceEmail})</span>
                <div className="admin-meta" style={{ marginTop: 4 }}>
                  « {c.lastContenu.length > 100 ? c.lastContenu.slice(0, 100) + '…' : c.lastContenu} »
                </div>
                <div className="admin-meta" style={{ marginTop: 2 }}>
                  {c.total} message{c.total > 1 ? 's' : ''}
                  {c.flaggedCount > 0 && (
                    <> · <strong style={{ color: '#c0392b' }}>{c.flaggedCount} signalé{c.flaggedCount > 1 ? 's' : ''}</strong></>
                  )}
                  {c.lastAt && <> · {dateCourte(c.lastAt)} {heureCourte(c.lastAt)}</>}
                </div>
              </div>
              <span className="btn btn-outline btn-sm">Lire le chat →</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
