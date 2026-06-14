'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function AdminButton({
  endpoint,
  body,
  label,
  className,
  confirmMsg,
  successMsg,
}: {
  endpoint: string;
  body: Record<string, unknown>;
  label: string;
  className?: string;
  confirmMsg?: string;
  successMsg?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast(data.error || 'Action impossible.');
    if (successMsg) toast(successMsg);
    router.refresh();
  }

  return (
    <button className={className || 'btn btn-dark btn-sm'} disabled={busy} onClick={run}>
      {busy ? '…' : label}
    </button>
  );
}
