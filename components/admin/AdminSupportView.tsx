'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Thread {
  userId: string;
  prenom: string;
  email: string;
  role: string;
  lastMessage: string;
  heure: string;
  unread: number;
}
interface Msg {
  id: string;
  fromAdmin: boolean;
  contenu: string;
  heure: string;
}

export default function AdminSupportView() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    const res = await fetch('/api/admin/support', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads || []);
  }, []);

  const loadMessages = useCallback(async (userId: string) => {
    const res = await fetch(`/api/admin/support?userId=${userId}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => {
    loadThreads();
    const i = setInterval(loadThreads, 10000);
    return () => clearInterval(i);
  }, [loadThreads]);

  useEffect(() => {
    if (!active) return;
    loadMessages(active.userId);
    const i = setInterval(() => loadMessages(active.userId), 5000);
    return () => clearInterval(i);
  }, [active, loadMessages]);

  function openThread(t: Thread) {
    setActive(t);
    setThreads((prev) => prev.map((x) => (x.userId === t.userId ? { ...x, unread: 0 } : x)));
  }

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    const txt = draft.trim();
    if (!txt) return;
    setDraft('');
    setSending(true);
    const res = await fetch('/api/admin/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: active.userId, contenu: txt }),
    });
    setSending(false);
    if (!res.ok) return toast('Envoi impossible.');
    setMessages((m) => [...m, { id: 'tmp' + Date.now(), fromAdmin: true, contenu: txt, heure: '' }]);
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });
  }

  return (
    <div className="support-admin">
      <div className="support-threads">
        {threads.length === 0 ? (
          <div className="admin-empty">Aucun message de support.</div>
        ) : (
          threads.map((t) => (
            <button
              key={t.userId}
              className={`support-thread${active?.userId === t.userId ? ' active' : ''}`}
              onClick={() => openThread(t)}
            >
              <div className="support-thread-top">
                <strong>{t.prenom}</strong>
                {t.unread > 0 && <span className="support-badge inline">{t.unread}</span>}
              </div>
              <div className="support-thread-mail">{t.email} · {t.role === 'FREELANCE' ? 'Freelance' : 'Client'}</div>
              <div className="support-thread-last">{t.lastMessage}</div>
            </button>
          ))
        )}
      </div>

      <div className="support-conv">
        {active ? (
          <>
            <div className="support-conv-head">
              <strong>{active.prenom}</strong> · {active.email}
            </div>
            <div className="support-conv-body" ref={bodyRef}>
              {messages.map((m) => (
                <div key={m.id} className={`support-msg ${m.fromAdmin ? 'moi' : 'eux'}`}>
                  {m.contenu}
                  {m.heure && <span className="heure">{m.heure}</span>}
                </div>
              ))}
            </div>
            <form className="support-input" onSubmit={reply}>
              <input
                type="text"
                placeholder="Votre réponse…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" disabled={sending} aria-label="Envoyer">
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="support-conv-empty">Sélectionnez une conversation à gauche.</div>
        )}
      </div>
    </div>
  );
}
