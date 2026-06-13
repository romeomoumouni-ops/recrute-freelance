'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Notif {
  id: string;
  type: string;
  titre: string;
  corps: string | null;
  lien: string | null;
  lu: boolean;
  heure: string;
}

export default function NotificationBell({
  count,
  onRead,
}: {
  count: number;
  onRead: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function openPanel() {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.notifications || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
    if (count > 0) {
      fetch('/api/notifications/read', { method: 'POST' })
        .then(() => onRead())
        .catch(() => {});
    }
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function go(n: Notif) {
    setOpen(false);
    if (n.lien) router.push(n.lien);
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className="notif-bell-btn"
        aria-label="Notifications"
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        🔔
        {count > 0 && <span className="badge-count">{count}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">Notifications</div>
          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">Chargement…</div>
            ) : items.length === 0 ? (
              <div className="notif-empty">Aucune notification pour le moment.</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  className={`notif-item${n.lu ? '' : ' unread'}`}
                  onClick={() => go(n)}
                >
                  <div className="notif-titre">{n.titre}</div>
                  {n.corps && <div className="notif-corps">{n.corps}</div>}
                  <div className="notif-heure">{n.heure}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
