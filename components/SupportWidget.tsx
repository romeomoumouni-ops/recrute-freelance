'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { LifeBuoy, X, Send } from 'lucide-react';

interface Msg {
  id: string;
  mine: boolean;
  contenu: string;
  heure: string;
}

export default function SupportWidget() {
  const pathname = usePathname();
  const [show, setShow] = useState(false); // utilisateur connecté ?
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // État de connexion + pastille de non-lus.
  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      const me = await res.json();
      setShow(!!me.authenticated);
      setUnread(me.supportUnread || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshMe();
    const i = setInterval(refreshMe, 15000);
    return () => clearInterval(i);
  }, [refreshMe, pathname]);

  const loadMessages = useCallback(async () => {
    const res = await fetch('/api/support', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
    setUnread(0);
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    loadMessages();
    const i = setInterval(loadMessages, 5000);
    return () => clearInterval(i);
  }, [open, loadMessages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const txt = draft.trim();
    if (!txt) return;
    setDraft('');
    setSending(true);
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu: txt }),
    });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      setMessages((m) => [...m, data.message]);
      requestAnimationFrame(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      });
    }
  }

  // Masqué : non connecté, ou dans l'espace admin.
  if (!show || pathname.startsWith('/admin')) return null;

  return (
    <div className="support-widget">
      {open && (
        <div className="support-panel">
          <div className="support-head">
            <div>
              <strong>Support recrutefreelance</strong>
              <div className="support-sub">On vous répond au plus vite.</div>
            </div>
            <button className="support-close" onClick={() => setOpen(false)} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <div className="support-body" ref={bodyRef}>
            {messages.length === 0 ? (
              <div className="support-empty">
                Une question, un souci ? Écrivez-nous — l&apos;équipe vous répond ici.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`support-msg ${m.mine ? 'moi' : 'eux'}`}>
                  {m.contenu}
                  <span className="heure">{m.heure}</span>
                </div>
              ))
            )}
          </div>
          <form className="support-input" onSubmit={send}>
            <input
              type="text"
              placeholder="Votre message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" disabled={sending} aria-label="Envoyer">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      <button
        className="support-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Support"
      >
        {open ? <X size={24} /> : <LifeBuoy size={24} />}
        {!open && unread > 0 && <span className="support-badge">{unread}</span>}
      </button>
    </div>
  );
}
