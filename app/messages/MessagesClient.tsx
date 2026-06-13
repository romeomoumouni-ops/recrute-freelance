'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Avatar from '@/components/Avatar';
import type { ConversationSummary } from '@/lib/conversations';
import { heureCourte, euros } from '@/lib/utils';
import { TAUX_FCFA } from '@/lib/constants';
import { toast } from '@/lib/toast';

interface Msg {
  id: string;
  mine: boolean;
  contenu: string;
  heure: string;
  type?: string;
  meta?: string | null;
}

function DevisCard({ m }: { m: Msg }) {
  let serviceTitre: string | null = null;
  let prix: number | null = null;
  try {
    if (m.meta) {
      const parsed = JSON.parse(m.meta);
      serviceTitre = parsed.serviceTitre ?? null;
      prix = typeof parsed.prix === 'number' ? parsed.prix : null;
    }
  } catch {
    /* ignore */
  }
  return (
    <div className={`devis-msg ${m.mine ? 'moi' : 'eux'}`}>
      <div className="devis-msg-head">📋 Demande de devis</div>
      {serviceTitre && (
        <div className="devis-msg-service">
          <span>{serviceTitre}</span>
          {prix != null && <span className="devis-msg-prix">dès {euros(prix)}</span>}
        </div>
      )}
      <p className="devis-msg-body">{m.contenu}</p>
      <span className="heure">{m.heure}</span>
    </div>
  );
}

function DevisOfferCard({
  m,
  onPay,
  paying,
}: {
  m: Msg;
  onPay: (id: string) => void;
  paying: boolean;
}) {
  let amountEur = 0;
  let description = '';
  let status = 'pending';
  try {
    if (m.meta) {
      const p = JSON.parse(m.meta);
      amountEur = p.amountEur || 0;
      description = p.description || '';
      status = p.status || 'pending';
    }
  } catch {
    /* ignore */
  }
  const fcfa = Math.round(amountEur * TAUX_FCFA);
  const paid = status === 'paid';
  return (
    <div className={`devis-msg offer ${m.mine ? 'moi' : 'eux'}`}>
      <div className="devis-msg-head">💼 Devis{paid ? ' · payé ✓' : ''}</div>
      <div className="devis-msg-service">
        <span>{description}</span>
        <span className="devis-msg-prix">{euros(amountEur)}</span>
      </div>
      {paid ? (
        <p className="devis-msg-body" style={{ color: 'var(--green)', fontWeight: 600 }}>
          ✓ Payé
        </p>
      ) : m.mine ? (
        <p className="devis-msg-body" style={{ color: 'var(--gray-500)' }}>
          En attente de paiement…
        </p>
      ) : (
        <button
          className="btn btn-dark btn-block"
          disabled={paying}
          onClick={() => onPay(m.id)}
          style={{ marginTop: 4 }}
        >
          {paying ? 'Redirection…' : `Payer par carte (${fcfa.toLocaleString('fr-FR')} FCFA)`}
        </button>
      )}
      <span className="heure">{m.heure}</span>
    </div>
  );
}

export default function MessagesClient({
  initialConversations,
}: {
  initialConversations: ConversationSummary[];
}) {
  const params = useSearchParams();
  const [convs, setConvs] = useState<ConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [showList, setShowList] = useState(true); // mobile : liste vs conversation
  const msgsRef = useRef<HTMLDivElement>(null);

  // Devis chiffré (payable par carte)
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerSending, setOfferSending] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function sendOffer() {
    if (!activeId) return;
    setOfferSending(true);
    const res = await fetch('/api/devis/offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: activeId,
        amountEur: Number(offerAmount),
        description: offerDesc.trim(),
      }),
    });
    const data = await res.json();
    setOfferSending(false);
    if (!res.ok) return toast(data.error || 'Envoi impossible.');
    setMessages((m) => [...m, data.message]);
    setOfferOpen(false);
    setOfferAmount('');
    setOfferDesc('');
    scrollBottom();
  }

  async function payOffer(offerMessageId: string) {
    setPayingId(offerMessageId);
    const res = await fetch('/api/devis/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerMessageId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPayingId(null);
      return toast(data.error || 'Paiement impossible.');
    }
    window.location.href = data.checkoutUrl; // redirection vers Chariow
  }

  const active = convs.find((c) => c.id === activeId) ?? null;

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    });
  }, []);

  const loadMessages = useCallback(
    async (id: string, scroll = false) => {
      const res = await fetch(`/api/messages?conversationId=${id}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
      // remet le compteur non lus à 0 localement
      setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
      if (scroll) scrollBottom();
    },
    [scrollBottom]
  );

  const loadConvs = useCallback(async () => {
    const res = await fetch('/api/conversations', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setConvs((prev) => {
      // conserve unread=0 pour la conversation active
      return (data.conversations as ConversationSummary[]).map((c) =>
        c.id === activeId ? { ...c, unread: 0 } : c
      );
    });
  }, [activeId]);

  function openConv(id: string) {
    setActiveId(id);
    setShowList(false);
    loadMessages(id, true);
  }

  // Ouverture initiale : ?c=... sinon première conversation sur desktop.
  useEffect(() => {
    const c = params.get('c');
    if (c && convs.some((x) => x.id === c)) {
      openConv(c);
    } else if (typeof window !== 'undefined' && window.innerWidth > 960 && convs.length) {
      openConv(convs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling : messages de la conversation active + liste.
  useEffect(() => {
    const i = setInterval(() => {
      if (activeId) loadMessages(activeId);
      loadConvs();
    }, 4000);
    return () => clearInterval(i);
  }, [activeId, loadMessages, loadConvs]);

  useEffect(() => {
    scrollBottom();
  }, [messages.length, scrollBottom]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const txt = draft.trim();
    if (!txt || !activeId) return;
    setDraft('');
    // optimistic
    const optimistic: Msg = {
      id: 'tmp-' + Math.round(performance.now()),
      mine: true,
      contenu: txt,
      heure: heureCourte(new Date()),
    };
    setMessages((m) => [...m, optimistic]);
    scrollBottom();

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeId, contenu: txt }),
    });
    if (!res.ok) {
      toast('Échec de l’envoi du message.');
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      return;
    }
    // recharge pour réconcilier (ids réels) et récupérer d'éventuels nouveaux messages
    loadMessages(activeId);
    loadConvs();
  }

  return (
    <div className={`chat-layout${showList ? ' vue-liste' : ''}`}>
      <div className="conv-list">
        <div className="conv-list-head">Messages</div>
        <div>
          {convs.length === 0 && (
            <div style={{ padding: 20, fontSize: '.82rem', color: 'var(--gray-500)' }}>
              Aucune conversation pour le moment.
            </div>
          )}
          {convs.map((c) => (
            <div
              key={c.id}
              className={`conv${c.id === activeId ? ' active' : ''}`}
              onClick={() => openConv(c.id)}
            >
              <Avatar nom={c.avecNom} photoUrl={c.avecPhoto} />
              <div className="conv-info">
                <div className="nom">{c.avecNom}</div>
                <div className="apercu">{c.apercu}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div className="heure">{c.heure}</div>
                {c.unread > 0 && <span className="conv-unread">{c.unread}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-zone">
        {active ? (
          <>
            <div className="chat-head">
              <button className="chat-back" onClick={() => setShowList(true)} aria-label="Retour">
                ←
              </button>
              <Avatar nom={active.avecNom} photoUrl={active.avecPhoto} />
              <div>
                <div className="nom">{active.avecNom}</div>
                <div className="statut-en-ligne">● En ligne</div>
              </div>
            </div>
            <div className="chat-msgs" ref={msgsRef}>
              {messages.map((m) =>
                m.type === 'DEVIS' ? (
                  <DevisCard key={m.id} m={m} />
                ) : m.type === 'DEVIS_OFFER' ? (
                  <DevisOfferCard key={m.id} m={m} onPay={payOffer} paying={payingId === m.id} />
                ) : (
                  <div key={m.id} className={`msg ${m.mine ? 'moi' : 'eux'}`}>
                    {m.contenu}
                    <span className="heure">{m.heure}</span>
                  </div>
                )
              )}
            </div>
            <form className="chat-input" onSubmit={send}>
              <button
                type="button"
                className="chat-devis-btn"
                title="Envoyer un devis à payer"
                onClick={() => setOfferOpen(true)}
              >
                💼
              </button>
              <input
                type="text"
                placeholder="Écrivez votre message…"
                autoComplete="off"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit">Envoyer</button>
            </form>
          </>
        ) : (
          <div className="chat-vide">Sélectionnez une conversation</div>
        )}
      </div>

      {/* Modal : envoyer un devis chiffré */}
      <div
        className={`modal-backdrop${offerOpen ? ' open' : ''}`}
        onClick={() => setOfferOpen(false)}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setOfferOpen(false)} aria-label="Fermer">
            ✕
          </button>
          <h2>Envoyer un devis</h2>
          <p className="sub">
            Le destinataire pourra le payer par carte. Les fonds (moins 10 % de commission) seront
            crédités sur votre solde.
          </p>
          <div className="field">
            <label>Prestation</label>
            <input
              type="text"
              placeholder="Ex : Refonte de la page d'accueil"
              value={offerDesc}
              onChange={(e) => setOfferDesc(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Montant (€)</label>
            <input
              type="number"
              min={8}
              placeholder="Ex : 450"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
            />
            <div className="hint">
              {offerAmount && Number(offerAmount) > 0
                ? `Le client paiera ≈ ${Math.round(Number(offerAmount) * TAUX_FCFA).toLocaleString('fr-FR')} FCFA · minimum 8 €`
                : 'Minimum 8 € (limite Chariow).'}
            </div>
          </div>
          <button
            className="btn btn-dark btn-block"
            disabled={offerSending || !offerDesc.trim() || Number(offerAmount) < 8}
            onClick={sendOffer}
          >
            {offerSending ? 'Envoi…' : 'Envoyer le devis'}
          </button>
        </div>
      </div>
    </div>
  );
}
