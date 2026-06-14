import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getThread } from '@/lib/admin-conversations';
import { dateCourte, heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function fileMeta(meta: string | null): { url: string; name: string } | null {
  if (!meta) return null;
  try {
    const m = JSON.parse(meta) as { url?: string; name?: string };
    if (m.url) return { url: m.url, name: m.name || 'fichier' };
  } catch {
    /* ignore */
  }
  return null;
}

export default async function AdminConversation({ params }: { params: { id: string } }) {
  const thread = await getThread(params.id);
  if (!thread) notFound();

  const clientId = thread.client?.id;

  return (
    <>
      <Link href="/admin/utilisateurs" className="admin-back">← Utilisateurs</Link>
      <h1 className="admin-h1">Conversation</h1>
      <p className="admin-sub">
        Entre{' '}
        <strong>{thread.client?.prenom ?? '—'}</strong> ({thread.client?.email ?? '—'}, client) et{' '}
        <strong>{thread.freelance?.prenom ?? '—'}</strong> ({thread.freelance?.email ?? '—'}, freelance).
        Lecture seule · {thread.messages.length} message{thread.messages.length > 1 ? 's' : ''}.
      </p>

      {thread.messages.length === 0 ? (
        <div className="admin-empty">Aucun message dans cette conversation.</div>
      ) : (
        <div className="admin-chat">
          {thread.messages.map((m) => {
            if (m.type === 'SYSTEM') {
              return (
                <div key={m.id} className="admin-chat-system">
                  {m.contenu} · {dateCourte(m.createdAt)} {heureCourte(m.createdAt)}
                </div>
              );
            }
            const right = m.senderId === clientId; // client à droite, freelance à gauche
            const file = m.type === 'FILE' ? fileMeta(m.meta) : null;
            return (
              <div key={m.id} className={`admin-msg ${right ? 'right' : 'left'}`}>
                <div className="admin-msg-head">
                  <strong>{m.senderName}</strong>
                  <span>{dateCourte(m.createdAt)} {heureCourte(m.createdAt)}</span>
                </div>
                <div className={`admin-msg-body${m.flagged ? ' flagged' : ''}`}>
                  {file ? (
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="admin-msg-file">
                      📎 {file.name}
                    </a>
                  ) : (
                    <span>{m.contenu}</span>
                  )}
                  {m.flagged && (
                    <span className="admin-msg-flag">⚠ signalé{m.flagReason ? ` : ${m.flagReason}` : ''}</span>
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
