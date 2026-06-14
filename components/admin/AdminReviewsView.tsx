'use client';

import { useState } from 'react';
import { dateCourte } from '@/lib/utils';
import AdminButton from './AdminButton';

export interface AdminReviewRow {
  id: string;
  note: number;
  commentaire: string | null;
  createdAt: string;
  author: string;
  freelance: string;
}

export default function AdminReviewsView({ reviews }: { reviews: AdminReviewRow[] }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = reviews.filter((r) => {
    if (!term) return true;
    return (
      r.author.toLowerCase().includes(term) ||
      r.freelance.toLowerCase().includes(term) ||
      (r.commentaire ?? '').toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" type="search" placeholder="Rechercher un auteur, un freelance, un mot…"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <div className="admin-empty">Aucun avis.</div>
      ) : (
        <div className="admin-cards">
          {list.map((r) => (
            <div className="admin-card" key={r.id}>
              <div className="admin-card-main">
                <div className="admin-meta">
                  <strong>{'★'.repeat(r.note)}{'☆'.repeat(5 - r.note)}</strong> · {r.author} → {r.freelance}{' '}
                  <span className="admin-date">· {dateCourte(r.createdAt)}</span>
                </div>
                {r.commentaire && <div className="admin-quote">« {r.commentaire} »</div>}
              </div>
              <div className="admin-card-actions">
                <AdminButton endpoint="/api/admin/review" body={{ id: r.id, action: 'delete' }}
                  label="Supprimer l'avis" className="btn btn-dark btn-sm"
                  confirmMsg="Supprimer définitivement cet avis ?" successMsg="Avis supprimé." />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
