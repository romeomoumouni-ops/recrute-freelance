'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function AdminValidationActions({ userId, prenom }: { userId: string; prenom: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: 'approve' | 'reject') {
    let motif: string | undefined;
    if (action === 'reject') {
      const r = window.prompt(`Motif du refus pour ${prenom} (visible par le freelance) :`, '');
      if (r === null) return; // annulé
      motif = r.trim();
    } else if (!window.confirm(`Approuver ${prenom} ? Son profil deviendra visible par les clients.`)) {
      return;
    }
    setBusy(true);
    const res = await fetch('/api/admin/validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, motif }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(data.error || 'Action impossible.');
    toast(action === 'approve' ? 'Freelance approuvé ✓' : 'Demande refusée.');
    router.refresh();
  }

  return (
    <div className="admin-card-actions">
      <button className="btn btn-dark btn-sm" disabled={busy} onClick={() => run('approve')}>
        Approuver
      </button>
      <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => run('reject')}>
        Refuser
      </button>
    </div>
  );
}
