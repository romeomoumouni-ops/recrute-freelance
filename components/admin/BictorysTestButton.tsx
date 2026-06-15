'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';

const TYPES: [string, string][] = [
  ['card', 'Carte bancaire'],
  ['orange_money', 'Orange Money'],
  ['mtn_money', 'MTN Money'],
  ['wave', 'Wave'],
  ['moov_money', 'Moov Money'],
];

export default function BictorysTestButton({ disabled }: { disabled?: boolean }) {
  const [amount, setAmount] = useState('5');
  const [type, setType] = useState('card');
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    try {
      const res = await fetch('/api/bictorys/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountEur: Number(amount) || 5, paymentType: type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        toast(data.error || 'Échec de la création du paiement.');
        setBusy(false);
        return;
      }
      // Redirige vers la page de paiement hébergée Bictorys (sandbox).
      window.location.href = data.url;
    } catch {
      toast('Erreur réseau.');
      setBusy(false);
    }
  }

  return (
    <div className="admin-panel" style={{ maxWidth: 460 }}>
      <div className="field">
        <label>Montant (€)</label>
        <input type="number" min={1} max={50} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field">
        <label>Moyen de paiement</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <button className="btn btn-dark" disabled={busy || disabled} onClick={pay}>
        {busy ? 'Redirection…' : 'Payer en test (sandbox)'}
      </button>
      {disabled && (
        <p className="hint" style={{ marginTop: 10, color: '#c0392b' }}>
          ⛔ Clé API Bictorys non configurée — ajoute les variables d’environnement (voir ci-dessus).
        </p>
      )}
    </div>
  );
}
