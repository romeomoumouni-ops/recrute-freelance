'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function AdminSettingsForm({
  commissionPct,
  banner,
}: {
  commissionPct: number;
  banner: string;
}) {
  const router = useRouter();
  const [pct, setPct] = useState(String(commissionPct));
  const [text, setText] = useState(banner);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_rate: Number(pct) / 100, banner_messagerie: text.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(data.error || 'Erreur.');
    toast('Réglages enregistrés ✓');
    router.refresh();
  }

  return (
    <div className="admin-panel" style={{ maxWidth: 620 }}>
      <div className="field">
        <label>Commission plateforme (%)</label>
        <input type="number" min={0} max={90} step={1} value={pct} onChange={(e) => setPct(e.target.value)} />
        <div className="hint">
          Modèle actuel : <strong>abonnement freelance</strong> (1er mois offert, puis 20 000 FCFA/mois) et
          <strong> 0 % de commission</strong>. Laisse ce champ à <strong>0</strong> — le freelance reçoit{' '}
          {100 - (Number(pct) || 0)} % de chaque mission.
        </div>
      </div>
      <div className="field">
        <label>Bandeau de sécurité (messagerie)</label>
        <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="hint">Affiché au-dessus du chat, pour clients et freelances.</div>
      </div>
      <button className="btn btn-dark" disabled={busy} onClick={save}>
        {busy ? 'Enregistrement…' : 'Enregistrer les réglages'}
      </button>
    </div>
  );
}
