'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';

export default function AdminBroadcastForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'CLIENT' | 'FREELANCE'>('all');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    if (subject.trim().length < 2 || message.trim().length < 2) {
      return toast('Sujet et message requis.');
    }
    if (!window.confirm(`Envoyer cet e-mail à : ${audience === 'all' ? 'tous les utilisateurs' : audience === 'CLIENT' ? 'tous les clients' : 'tous les freelances'} ?`)) return;
    setBusy(true);
    setResult(null);
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject.trim(), message: message.trim(), audience }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(data.error || 'Erreur.');
    setResult(`✅ Envoyé à ${data.sent} / ${data.total} destinataires.`);
    toast('Communication envoyée ✓');
  }

  return (
    <div className="admin-panel" style={{ maxWidth: 620 }}>
      <div className="field">
        <label>Destinataires</label>
        <select value={audience} onChange={(e) => setAudience(e.target.value as 'all' | 'CLIENT' | 'FREELANCE')}>
          <option value="all">Tous les utilisateurs</option>
          <option value="CLIENT">Clients uniquement</option>
          <option value="FREELANCE">Freelances uniquement</option>
        </select>
      </div>
      <div className="field">
        <label>Sujet</label>
        <input type="text" maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex : Nouveauté sur la plateforme" />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea rows={7} maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Votre message… (les sauts de ligne sont conservés)" />
      </div>
      <button className="btn btn-dark" disabled={busy} onClick={send}>
        {busy ? 'Envoi en cours…' : 'Envoyer la communication'}
      </button>
      {result && <p className="hint" style={{ marginTop: 12, color: 'var(--green)' }}>{result}</p>}
    </div>
  );
}
