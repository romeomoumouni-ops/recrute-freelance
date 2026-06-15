'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  Briefcase,
  Wallet,
  Paperclip,
  CheckCircle2,
  Package,
  ArrowLeft,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import type { ConversationSummary } from '@/lib/conversations';
import { heureCourte, euros } from '@/lib/utils';
import { TIER_AMOUNTS } from '@/lib/chariow-products';
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
      <div className="devis-msg-head">
        <ClipboardList size={14} /> Demande de devis {m.mine ? 'envoyée' : 'reçue'}
      </div>
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

const STATUT_LABELS: Record<string, string> = {
  pending: 'en attente de paiement',
  paid: 'payée · en cours',
  delivered: 'livrée · à valider',
  validated: 'validée ✓',
};

function DevisOfferCard({
  m,
  onPay,
  onDeliver,
  onValidate,
  onRevise,
  busy,
}: {
  m: Msg;
  onPay: (id: string) => void;
  onDeliver: (id: string) => void;
  onValidate: (id: string) => void;
  onRevise: (id: string) => void;
  busy: boolean;
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
  const mine = m.mine; // true = freelance émetteur du devis

  return (
    <div className={`devis-msg offer ${mine ? 'moi' : 'eux'}`}>
      <div className="devis-msg-head"><Briefcase size={14} /> Commande · {STATUT_LABELS[status] ?? status}</div>
      <div className="devis-msg-service">
        <span>{description}</span>
        <span className="devis-msg-prix">{euros(amountEur)}</span>
      </div>

      {/* En attente de paiement */}
      {status === 'pending' &&
        (mine ? (
          <p className="devis-msg-body" style={{ color: 'var(--gray-500)' }}>
            En attente de paiement…
          </p>
        ) : (
          <button
            className="btn btn-dark btn-block"
            disabled={busy}
            onClick={() => onPay(m.id)}
            style={{ marginTop: 4 }}
          >
            {busy ? 'Redirection…' : `Payer ${euros(amountEur)} par carte`}
          </button>
        ))}

      {/* Payée — en cours (séquestre) */}
      {status === 'paid' &&
        (mine ? (
          <>
            <p className="devis-msg-body" style={{ color: 'var(--gray-500)' }}>
              <Wallet size={14} /> Paiement reçu (séquestré). Joignez votre travail via{' '}
              <Paperclip size={13} /> puis livrez.
            </p>
            <button
              className="btn btn-dark btn-block"
              disabled={busy}
              onClick={() => onDeliver(m.id)}
              style={{ marginTop: 4 }}
            >
              {busy ? '…' : 'Livrer la commande'}
            </button>
          </>
        ) : (
          <p className="devis-msg-body" style={{ color: 'var(--green)', fontWeight: 600 }}>
            <CheckCircle2 size={15} /> Paiement effectué — fonds sécurisés. En attente de la livraison du freelance.
          </p>
        ))}

      {/* Livrée — à valider */}
      {status === 'delivered' &&
        (mine ? (
          <p className="devis-msg-body" style={{ color: 'var(--gray-500)' }}>
            <Package size={15} /> Livré — en attente de validation du client.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <button className="btn btn-dark" disabled={busy} onClick={() => onValidate(m.id)}>
              {busy ? '…' : 'Valider la commande'}
            </button>
            <button className="btn btn-outline" disabled={busy} onClick={() => onRevise(m.id)}>
              Demander une retouche
            </button>
          </div>
        ))}

      {/* Validée */}
      {status === 'validated' && (
        <p className="devis-msg-body" style={{ color: 'var(--green)', fontWeight: 600 }}>
          <CheckCircle2 size={15} /> Commande validée — fonds versés au freelance.
        </p>
      )}

      <span className="heure">{m.heure}</span>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function FileCard({ m }: { m: Msg }) {
  let url = '';
  let name = 'fichier';
  let size = 0;
  try {
    if (m.meta) {
      const p = JSON.parse(m.meta);
      url = p.url || '';
      name = p.name || name;
      size = p.size || 0;
    }
  } catch {
    /* ignore */
  }
  return (
    <a
      className={`msg file ${m.mine ? 'moi' : 'eux'}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download
    >
      <span className="file-ic"><Paperclip size={16} /></span>
      <span className="file-name">{name}</span>
      {size > 0 && <span className="file-size">{formatSize(size)}</span>}
      <span className="heure">{m.heure}</span>
    </a>
  );
}

// Widget Chariow "Snap" : affiche un bouton de paiement qui ouvre la caisse
// en pop-up, sans quitter le site. On (re)charge le script à chaque montage
// pour qu'il détecte le div fraîchement rendu.
function ChariowWidget({ productId, storeDomain }: { productId: string; storeDomain: string }) {
  useEffect(() => {
    if (!document.querySelector('link[data-chariow]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://js.chariowcdn.com/v1/widget.min.css';
      link.setAttribute('data-chariow', '1');
      document.head.appendChild(link);
    }
    const prev = document.getElementById('chariow-widget-script');
    if (prev) prev.remove();
    const script = document.createElement('script');
    script.id = 'chariow-widget-script';
    script.src = 'https://js.chariowcdn.com/v1/widget.min.js';
    script.async = true;
    document.head.appendChild(script);
  }, [productId]);

  return (
    <div
      id="chariow-widget"
      data-product-id={productId}
      data-store-domain={storeDomain}
      data-style="tap"
      data-border-style="rounded"
      data-cta-width="lg"
      data-background-color="#FFFFFF"
      data-cta-animation="shake_scale"
      data-locale="fr"
      data-primary-color="#0d0d0d"
    />
  );
}

export default function MessagesClient({
  initialConversations,
  banner,
  role,
}: {
  initialConversations: ConversationSummary[];
  banner: string;
  role: 'CLIENT' | 'FREELANCE';
}) {
  const isClient = role === 'CLIENT';
  const offerTitre = isClient ? 'Envoyer une proposition de prix' : 'Envoyer un devis';
  const offerSubmit = isClient ? 'Envoyer la proposition' : 'Envoyer le devis';
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
  const [payModal, setPayModal] = useState<{
    productId: string;
    storeDomain: string;
    checkoutUrl: string;
  } | null>(null);

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
    setPayingId(null);
    if (!res.ok) return toast(data.error || 'Paiement impossible.');
    // Ouvre le widget Chariow en pop-up (sur le site) au lieu de rediriger.
    setPayModal({
      productId: data.productId,
      storeDomain: data.storeDomain,
      checkoutUrl: data.checkoutUrl,
    });
  }

  // Actions sur une commande (livrer / valider / retouche).
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function orderAction(offerMessageId: string, endpoint: string, okMsg: string) {
    setBusyId(offerMessageId);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerMessageId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) return toast(data.error || 'Action impossible.');
    toast(okMsg);
    if (activeId) loadMessages(activeId);
  }
  const deliverOrder = (id: string) => orderAction(id, '/api/devis/deliver', 'Commande livrée ✓');
  const validateOrder = (id: string) => orderAction(id, '/api/devis/validate', 'Commande validée ✓');
  const requestRevision = (id: string) =>
    orderAction(id, '/api/devis/revision', 'Retouche demandée');

  async function sendFile(file: File) {
    if (!activeId) return;
    setBusyId('file');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('conversationId', activeId);
    const res = await fetch('/api/messages/file', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (fileInput.current) fileInput.current.value = '';
    if (!res.ok) return toast(data.error || 'Envoi du fichier impossible.');
    setMessages((m) => [...m, data.message]);
    scrollBottom();
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
                <ArrowLeft size={20} />
              </button>
              <Avatar nom={active.avecNom} photoUrl={active.avecPhoto} />
              <div>
                <div className="nom">{active.avecNom}</div>
                <div className="statut-en-ligne">● En ligne</div>
              </div>
            </div>
            <div className="chat-safety"><AlertTriangle size={14} /> <span>{banner}</span></div>
            <div className="chat-msgs" ref={msgsRef}>
              {messages.map((m) =>
                m.type === 'DEVIS' ? (
                  <DevisCard key={m.id} m={m} />
                ) : m.type === 'DEVIS_OFFER' ? (
                  <DevisOfferCard
                    key={m.id}
                    m={m}
                    onPay={payOffer}
                    onDeliver={deliverOrder}
                    onValidate={validateOrder}
                    onRevise={requestRevision}
                    busy={payingId === m.id || busyId === m.id}
                  />
                ) : m.type === 'FILE' ? (
                  <FileCard key={m.id} m={m} />
                ) : m.type === 'SYSTEM' ? (
                  <div key={m.id} className="msg-system">
                    {m.contenu}
                    <span className="heure-sys">{m.heure}</span>
                  </div>
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
                title={offerTitre}
                onClick={() => setOfferOpen(true)}
              >
                <Briefcase size={18} />
              </button>
              <input
                ref={fileInput}
                type="file"
                hidden
                onChange={(e) => e.target.files?.[0] && sendFile(e.target.files[0])}
              />
              <button
                type="button"
                className="chat-devis-btn"
                title="Joindre un fichier (livraison)"
                disabled={busyId === 'file'}
                onClick={() => fileInput.current?.click()}
              >
                {busyId === 'file' ? <Loader2 size={18} className="spin" /> : <Paperclip size={18} />}
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
            <X size={18} />
          </button>
          <h2>{offerTitre}</h2>
          <p className="sub">
            {isClient
              ? 'Proposez un montant pour cette prestation. Le paiement par carte est sécurisé et conservé jusqu’à la livraison validée.'
              : 'Le destinataire pourra le payer par carte. Les fonds (moins 20 % de commission) sont sécurisés, puis versés sur votre solde une fois la commande livrée et validée.'}
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
            <label>Montant</label>
            <select value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)}>
              <option value="">Choisir un montant…</option>
              {TIER_AMOUNTS.map((a) => (
                <option key={a} value={a}>
                  {euros(a)}
                </option>
              ))}
            </select>
            <div className="hint">
              {offerAmount
                ? `Le client paiera ${euros(Number(offerAmount))} par carte.`
                : 'Montants disponibles au paiement par carte.'}
            </div>
          </div>
          <button
            className="btn btn-dark btn-block"
            disabled={offerSending || !offerDesc.trim() || !TIER_AMOUNTS.includes(Number(offerAmount))}
            onClick={sendOffer}
          >
            {offerSending ? 'Envoi…' : offerSubmit}
          </button>
        </div>
      </div>

      {/* Pop-up de paiement Chariow (sur le site) */}
      {payModal && (
        <div
          className="modal-backdrop open"
          onClick={() => {
            setPayModal(null);
            if (activeId) loadMessages(activeId);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => {
                setPayModal(null);
                if (activeId) loadMessages(activeId);
              }}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
            <h2>Paiement sécurisé</h2>
            <p className="sub">
              Réglez par carte (Visa / Mastercard) sans quitter le site. Les fonds sont sécurisés
              jusqu&apos;à la livraison et la validation de la commande.
            </p>
            <div className="chariow-pay">
              <ChariowWidget productId={payModal.productId} storeDomain={payModal.storeDomain} />
            </div>
            <p className="hint" style={{ marginTop: 14 }}>
              Le bouton de paiement ne s&apos;affiche pas ?{' '}
              <a href={payModal.checkoutUrl} target="_blank" rel="noopener noreferrer">
                Payer dans un nouvel onglet
              </a>
              .
            </p>
            <p className="hint">Une fois le paiement effectué, fermez cette fenêtre.</p>
          </div>
        </div>
      )}
    </div>
  );
}
