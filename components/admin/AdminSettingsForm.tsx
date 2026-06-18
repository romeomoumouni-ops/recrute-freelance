'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function AdminSettingsForm({
  commissionPct,
  banner,
  abonnementUrl,
}: {
  commissionPct: number;
  banner: string;
  abonnementUrl: string;
}) {
  const router = useRouter();
  const [pct, setPct] = useState(String(commissionPct));
  const [text, setText] = useState(banner);
  const [aboUrl, setAboUrl] = useState(abonnementUrl);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commission_rate: Number(pct) / 100,
        banner_messagerie: text.trim(),
        abonnement_url: aboUrl.trim(),
      }),
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
          Modèle actuel : <strong>abonnement freelance</strong> (7 jours d&apos;essai gratuits, puis 20 000 FCFA/mois) et
          <strong> 0 % de commission</strong>. Laisse ce champ à <strong>0</strong> — le freelance reçoit{' '}
          {100 - (Number(pct) || 0)} % de chaque mission.
        </div>
      </div>
      <div className="field">
        <label>Lien de paiement de l&apos;abonnement (Chariow)</label>
        <input
          type="url"
          placeholder="https://…"
          value={aboUrl}
          onChange={(e) => setAboUrl(e.target.value)}
        />
        <div className="hint">
          Lien Chariow vers lequel le freelance est redirigé pour payer les 20 000 FCFA/mois quand son
          essai de 7 jours est terminé. Après paiement, réactive le compte depuis sa fiche (« Réactiver
          l&apos;abonnement »).
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
