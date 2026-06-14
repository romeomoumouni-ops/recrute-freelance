'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dateCourte } from '@/lib/utils';
import AdminButton from './AdminButton';

export interface AdminUserRow {
  id: string;
  prenom: string;
  email: string;
  role: string;
  banni: boolean;
  estVerifie: boolean;
  pays: string | null;
  createdAt: string;
}

export default function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const [q, setQ] = useState('');
  const [filtre, setFiltre] = useState<'tous' | 'CLIENT' | 'FREELANCE' | 'banni'>('tous');

  const term = q.trim().toLowerCase();
  const list = users.filter((u) => {
    if (filtre === 'banni' && !u.banni) return false;
    if ((filtre === 'CLIENT' || filtre === 'FREELANCE') && u.role !== filtre) return false;
    if (!term) return true;
    return u.prenom.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          placeholder="Rechercher un nom ou un e-mail…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="admin-filters">
          {([['tous', 'Tous'], ['CLIENT', 'Clients'], ['FREELANCE', 'Freelances'], ['banni', 'Bannis']] as const).map(
            ([v, l]) => (
              <button key={v} className={filtre === v ? 'active' : ''} onClick={() => setFiltre(v)}>
                {l}
              </button>
            )
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Statut</th><th>Inscrit</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td data-label="Nom">
                  <Link href={`/admin/utilisateurs/${u.id}`} className="admin-link">
                    <strong>{u.prenom}</strong>
                  </Link>
                  {u.pays ? ` · ${u.pays}` : ''}
                </td>
                <td data-label="E-mail">{u.email}</td>
                <td data-label="Rôle">{u.role === 'FREELANCE' ? 'Freelance' : 'Client'}</td>
                <td data-label="Statut">
                  {u.banni && <span className="status red">banni</span>}
                  {u.role === 'FREELANCE' && !u.banni && (
                    <span className={`status ${u.estVerifie ? 'green' : 'gray'}`}>
                      {u.estVerifie ? 'vérifié' : 'non vérifié'}
                    </span>
                  )}
                </td>
                <td data-label="Inscrit">{dateCourte(u.createdAt)}</td>
                <td data-label="Actions" className="td-action">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {u.role === 'FREELANCE' && (
                      <AdminButton
                        endpoint="/api/admin/user"
                        body={{ id: u.id, action: u.estVerifie ? 'unverify' : 'verify' }}
                        label={u.estVerifie ? 'Retirer badge' : 'Vérifier'}
                        className="btn btn-outline btn-sm"
                        successMsg="Mis à jour."
                      />
                    )}
                    <AdminButton
                      endpoint="/api/admin/user"
                      body={{ id: u.id, action: u.banni ? 'unban' : 'ban' }}
                      label={u.banni ? 'Débannir' : 'Bannir'}
                      className={u.banni ? 'btn btn-outline btn-sm' : 'btn btn-dark btn-sm'}
                      confirmMsg={u.banni ? undefined : `Bannir ${u.prenom} ?`}
                      successMsg="Mis à jour."
                    />
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 24 }}>Aucun résultat.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
