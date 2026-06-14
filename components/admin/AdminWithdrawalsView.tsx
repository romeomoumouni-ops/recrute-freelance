'use client';

import { useState } from 'react';
import { euros, fcfa, dateCourte } from '@/lib/utils';
import { OPERATEUR_LABEL, TAUX_FCFA } from '@/lib/constants';
import AdminButton from './AdminButton';

export interface AdminWithdrawalRow {
  id: string;
  montant: number;
  operateur: string;
  numero: string;
  statut: string;
  createdAt: string;
  prenom: string;
  email: string;
}

export default function AdminWithdrawalsView({ rows }: { rows: AdminWithdrawalRow[] }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const match = (w: AdminWithdrawalRow) =>
    !term ||
    w.prenom.toLowerCase().includes(term) ||
    w.email.toLowerCase().includes(term) ||
    w.numero.toLowerCase().includes(term);

  const enAttente = rows.filter((w) => w.statut === 'EN_ATTENTE' && match(w));
  const historique = rows.filter((w) => w.statut !== 'EN_ATTENTE' && match(w));

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" type="search" placeholder="Rechercher un freelance, un e-mail, un numéro…"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <h2 className="admin-h2" style={{ marginTop: 8 }}>À traiter ({enAttente.length})</h2>
      {enAttente.length === 0 ? (
        <div className="admin-empty">Aucun retrait en attente. 🎉</div>
      ) : (
        <div className="admin-cards">
          {enAttente.map((w) => (
            <div className="admin-card hot" key={w.id}>
              <div className="admin-card-main">
                <div className="admin-amount">{euros(w.montant)} <span>≈ {fcfa(Math.round(w.montant * TAUX_FCFA))}</span></div>
                <div className="admin-meta">
                  <strong>{w.prenom}</strong> · {w.email}<br />
                  📱 <strong>{w.numero}</strong> · {OPERATEUR_LABEL[w.operateur] ?? w.operateur}<br />
                  <span className="admin-date">Demandé le {dateCourte(w.createdAt)}</span>
                </div>
              </div>
              <div className="admin-card-actions">
                <AdminButton endpoint="/api/admin/withdrawal" body={{ id: w.id, action: 'settle' }}
                  label="✓ Marquer envoyé" className="btn btn-dark btn-sm"
                  confirmMsg={`Confirmer : ${euros(w.montant)} envoyés sur ${w.numero} ?`} successMsg="Retrait marqué comme envoyé." />
                <AdminButton endpoint="/api/admin/withdrawal" body={{ id: w.id, action: 'reject' }}
                  label="Rejeter (rembourser)" className="btn btn-outline btn-sm"
                  confirmMsg="Rejeter ce retrait et recréditer le solde du freelance ?" successMsg="Retrait rejeté, solde recrédité." />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="admin-h2">Historique ({historique.length})</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Freelance</th><th>Montant</th><th>Numéro</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody>
            {historique.slice(0, 60).map((w) => (
              <tr key={w.id}>
                <td data-label="Freelance">{w.prenom}</td>
                <td data-label="Montant">{euros(w.montant)}</td>
                <td data-label="Numéro">{w.numero}</td>
                <td data-label="Statut"><span className={`status ${w.statut === 'EFFECTUE' ? 'green' : 'gray'}`}>{w.statut}</span></td>
                <td data-label="Date">{dateCourte(w.createdAt)}</td>
              </tr>
            ))}
            {historique.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 20 }}>Aucun retrait.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
