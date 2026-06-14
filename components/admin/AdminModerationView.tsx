'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dateCourte } from '@/lib/utils';
import AdminButton from './AdminButton';

export interface AdminFlagRow {
  id: string;
  contenu: string;
  flagReason: string | null;
  createdAt: string;
  senderId: string;
  senderPrenom: string;
  senderEmail: string;
  senderBanni: boolean;
  conversationId: string | null;
}

export default function AdminModerationView({ flags }: { flags: AdminFlagRow[] }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = flags.filter((m) => {
    if (!term) return true;
    return (
      m.senderPrenom.toLowerCase().includes(term) ||
      m.senderEmail.toLowerCase().includes(term) ||
      m.contenu.toLowerCase().includes(term) ||
      (m.flagReason ?? '').toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" type="search" placeholder="Rechercher un expéditeur, un mot, un motif…"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <div className="admin-empty">Aucun message signalé. ✅</div>
      ) : (
        <div className="admin-cards">
          {list.map((m) => (
            <div className="admin-card hot" key={m.id}>
              <div className="admin-card-main">
                <div className="admin-meta">
                  <strong>{m.senderPrenom}</strong> · {m.senderEmail}{' '}
                  {m.senderBanni && <span className="status red">banni</span>}<br />
                  <span className="admin-flagreason">🚩 {m.flagReason}</span>{' '}
                  <span className="admin-date">· {dateCourte(m.createdAt)}</span>
                </div>
                <div className="admin-quote">« {m.contenu} »</div>
              </div>
              <div className="admin-card-actions">
                {m.conversationId && (
                  <Link href={`/admin/conversations/${m.conversationId}`} className="btn btn-outline btn-sm">
                    Voir la conversation
                  </Link>
                )}
                <AdminButton endpoint="/api/admin/message" body={{ id: m.id, action: 'dismiss' }}
                  label="✓ Traité" className="btn btn-outline btn-sm" successMsg="Retiré de la file." />
                {!m.senderBanni && (
                  <AdminButton endpoint="/api/admin/user" body={{ id: m.senderId, action: 'ban' }}
                    label="🚫 Bannir l'expéditeur" className="btn btn-dark btn-sm"
                    confirmMsg={`Bannir ${m.senderPrenom} ?`} successMsg="Utilisateur banni." />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
