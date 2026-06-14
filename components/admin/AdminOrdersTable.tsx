'use client';

import { useState } from 'react';
import { euros, dateCourte } from '@/lib/utils';

export interface AdminOrderRow {
  id: string;
  titre: string;
  montant: number;
  statut: string;
  createdAt: string;
  client: string;
  freelance: string;
}

const STATUTS = ['TOUS', 'EN_COURS', 'LIVREE', 'VALIDEE', 'ANNULEE'];

export default function AdminOrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [statut, setStatut] = useState('TOUS');
  const list = statut === 'TOUS' ? orders : orders.filter((o) => o.statut === statut);

  return (
    <>
      <div className="admin-filters" style={{ marginBottom: 14 }}>
        {STATUTS.map((s) => (
          <button key={s} className={statut === s ? 'active' : ''} onClick={() => setStatut(s)}>
            {s === 'TOUS' ? 'Toutes' : s}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Mission</th><th>Client</th><th>Freelance</th><th>Net</th><th>Statut</th><th>Date</th></tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td data-label="Mission"><strong>{o.titre}</strong></td>
                <td data-label="Client">{o.client}</td>
                <td data-label="Freelance">{o.freelance}</td>
                <td data-label="Net">{euros(o.montant)}</td>
                <td data-label="Statut"><span className="status gray">{o.statut}</span></td>
                <td data-label="Date">{dateCourte(o.createdAt)}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 24 }}>Aucune commande.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
