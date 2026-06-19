'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';

type Audience = 'all' | 'CLIENT' | 'FREELANCE' | 'FREELANCE_UNVERIFIED';

export default function AdminBroadcastForm({
  adminEmail,
  counts,
}: {
  adminEmail: string;
  counts: { all: number; CLIENT: number; FREELANCE: number; FREELANCE_UNVERIFIED: number };
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [busy, setBusy] = useState<null | 'test' | 'send'>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audienceLabel =
    audience === 'all'
      ? 'tous les utilisateurs'
      : audience === 'CLIENT'
        ? 'tous les clients'
        : audience === 'FREELANCE_UNVERIFIED'
          ? 'les freelances non vérifiés'
          : 'tous les freelances';
  const target = counts[audience];

  async function post(test: boolean) {
    if (subject.trim().length < 2 || message.trim().length < 2) {
      toast('Sujet et message requis.');
      return;
    }
    if (!test && !window.confirm(`Envoyer cet e-mail à ${audienceLabel} (${target} destinataire${target > 1 ? 's' : ''}) ?`))
      return;

    setBusy(test ? 'test' : 'send');
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), audience, test }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l’envoi.');
        toast('Échec de l’envoi.');
        return;
      }
      if (test) {
        setResult(`Test envoyé à ${data.to}. Vérifie ta boîte mail (et les spams).`);
        toast('Test envoyé ✓');
      } else {
        const failedNote = data.failed ? ` · ${data.failed} échec(s)` : '';
        setResult(`Envoyé à ${data.sent} / ${data.total} destinataires${failedNote}.`);
        toast('Communication envoyée ✓');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-panel" style={{ maxWidth: 620 }}>
      <div className="field">
        <label>Destinataires</label>
        <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
          <option value="all">Tous les utilisateurs ({counts.all})</option>
          <option value="CLIENT">Clients uniquement ({counts.CLIENT})</option>
          <option value="FREELANCE">Freelances uniquement ({counts.FREELANCE})</option>
          <option value="FREELANCE_UNVERIFIED">Freelances non vérifiés ({counts.FREELANCE_UNVERIFIED})</option>
        </select>
      </div>
      <div className="field">
        <label>Sujet</label>
        <input
          type="text"
          maxLength={150}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex : Nouveauté sur la plateforme"
        />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea
          rows={7}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre message… (les sauts de ligne sont conservés)"
        />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-outline btn-sm" disabled={busy !== null} onClick={() => post(true)}>
          {busy === 'test' ? 'Envoi du test…' : `Envoyer un test à moi (${adminEmail})`}
        </button>
        <button className="btn btn-dark" disabled={busy !== null} onClick={() => post(false)}>
          {busy === 'send' ? 'Envoi en cours…' : `Envoyer à ${audienceLabel} (${target})`}
        </button>
      </div>

      <p className="hint" style={{ marginTop: 10 }}>
        Conseil : commence toujours par un <strong>test</strong> pour vérifier le rendu avant l’envoi global.
      </p>

      {result && (
        <p className="hint" style={{ marginTop: 12, color: 'var(--green)', fontWeight: 600 }}>✅ {result}</p>
      )}
      {error && (
        <p className="hint" style={{ marginTop: 12, color: '#c0392b', fontWeight: 600 }}>⛔ {error}</p>
      )}
    </div>
  );
}
