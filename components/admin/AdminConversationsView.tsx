'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dateCourte, heureCourte } from '@/lib/utils';
import type { AdminConvRow } from '@/lib/admin-conversations';

export default function AdminConversationsView({ rows }: { rows: AdminConvRow[] }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = rows.filter((r) => {
    if (!term) return true;
    return (
      r.clientNom.toLowerCase().includes(term) ||
      r.clientEmail.toLowerCase().includes(term) ||
      r.freelanceNom.toLowerCase().includes(term) ||
      r.freelanceEmail.toLowerCase().includes(term) ||
      r.lastContenu.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          placeholder="Rechercher un client, un freelance, un e-mail, un message…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <div className="admin-empty">Aucune conversation.</div>
      ) : (
        <div className="admin-cards">
          {list.map((r) => (
            <Link
              key={r.id}
              href={`/admin/conversations/${r.id}`}
              className={`admin-card${r.flaggedCount ? ' hot' : ''}`}
            >
              <div className="admin-card-main">
                <strong>{r.clientNom}</strong> <span className="admin-meta">↔</span>{' '}
                <strong>{r.freelanceNom}</strong>
                <div className="admin-meta" style={{ marginTop: 2 }}>
                  {r.clientEmail} · {r.freelanceEmail}
                </div>
                <div className="admin-meta" style={{ marginTop: 4 }}>
                  « {r.lastContenu.length > 90 ? r.lastContenu.slice(0, 90) + '…' : r.lastContenu} »
                </div>
                <div className="admin-meta" style={{ marginTop: 2 }}>
                  {r.total} message{r.total > 1 ? 's' : ''}
                  {r.flaggedCount > 0 && (
                    <>
                      {' · '}
                      <strong style={{ color: '#c0392b' }}>
                        {r.flaggedCount} signalé{r.flaggedCount > 1 ? 's' : ''}
                      </strong>
                    </>
                  )}
                  {r.lastAt && <> · {dateCourte(r.lastAt)} {heureCourte(r.lastAt)}</>}
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
