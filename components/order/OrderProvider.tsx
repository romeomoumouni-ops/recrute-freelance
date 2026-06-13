'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { COMMISSION } from '@/lib/constants';
import { euros } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface ServiceLite {
  id: string;
  titre: string;
  prix: number;
  delaiJours: number;
}

interface OrderCtx {
  isLogged: boolean;
  startGeneral: () => void;
  startService: (s: ServiceLite) => void;
  contact: () => void;
  hasTarifJour: boolean;
}

const Ctx = createContext<OrderCtx | null>(null);
export function useOrder() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOrder must be used within OrderProvider');
  return c;
}

interface Draft {
  serviceId?: string;
  mode: 'jour' | 'flat';
  unitPrice: number; // tarif/jour ou prix forfait
  titre: string;
  description: string;
  jours: number;
}

type Step = 'closed' | 'brief' | 'pay' | 'success';

export default function OrderProvider({
  freelanceId,
  freelanceNom,
  tarifJour,
  isLogged,
  loginUrl,
  children,
}: {
  freelanceId: string;
  freelanceNom: string;
  tarifJour: number | null;
  isLogged: boolean;
  loginUrl: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('closed');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [briefError, setBriefError] = useState('');

  const requireLogin = useCallback(() => {
    router.push(`/connexion?callbackUrl=${encodeURIComponent(loginUrl)}`);
  }, [router, loginUrl]);

  const startGeneral = useCallback(() => {
    if (!isLogged) return requireLogin();
    if (tarifJour == null) {
      toast('Choisissez un des services proposés pour commander.');
      return;
    }
    setDraft({ mode: 'jour', unitPrice: tarifJour, titre: '', description: '', jours: 5 });
    setBriefError('');
    setStep('brief');
  }, [isLogged, tarifJour, requireLogin]);

  const startService = useCallback(
    (s: ServiceLite) => {
      if (!isLogged) return requireLogin();
      setDraft({
        serviceId: s.id,
        mode: 'flat',
        unitPrice: s.prix,
        titre: s.titre,
        description: '',
        jours: s.delaiJours,
      });
      setBriefError('');
      setStep('brief');
    },
    [isLogged, requireLogin]
  );

  const contact = useCallback(async () => {
    if (!isLogged) return requireLogin();
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelanceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Impossible de démarrer la conversation.');
        return;
      }
      router.push(`/messages?c=${data.conversationId}`);
    } catch {
      toast('Erreur réseau.');
    }
  }, [isLogged, freelanceId, requireLogin, router]);

  const montant = draft ? (draft.mode === 'jour' ? draft.unitPrice * draft.jours : draft.unitPrice) : 0;
  const commission = Math.round(montant * COMMISSION);
  const total = montant + commission;

  function goPay() {
    if (!draft) return;
    if (!draft.titre.trim()) {
      setBriefError('Donnez un titre à votre mission.');
      return;
    }
    setBriefError('');
    setStep('pay');
  }

  async function pay() {
    if (!draft) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelanceId,
          serviceId: draft.serviceId,
          titre: draft.titre.trim(),
          description: draft.description.trim(),
          jours: draft.jours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Le paiement a échoué.');
        setSubmitting(false);
        return;
      }
      setStep('success');
    } catch {
      toast('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setStep('closed');
    setDraft(null);
    router.refresh();
  }

  return (
    <Ctx.Provider value={{ isLogged, startGeneral, startService, contact, hasTarifJour: tarifJour != null }}>
      {children}

      <div className={`modal-backdrop${step !== 'closed' ? ' open' : ''}`} onClick={close}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          {step === 'brief' && draft && (
            <>
              <button className="modal-close" onClick={close} aria-label="Fermer">
                ✕
              </button>
              <h2>Décrivez votre mission</h2>
              <p className="sub">Étape 1 sur 2 — {freelanceNom} recevra ce brief.</p>
              {briefError && <div className="form-error">{briefError}</div>}
              <div className="field">
                <label>Titre de la mission</label>
                <input
                  type="text"
                  placeholder="Ex : Refonte de mon site vitrine"
                  value={draft.titre}
                  onChange={(e) => setDraft({ ...draft, titre: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea
                  rows={4}
                  placeholder="Décrivez votre besoin, vos délais, vos attentes…"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Durée de la mission (jours)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draft.jours}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      jours: Math.max(1, Math.min(60, Number(e.target.value) || 1)),
                    })
                  }
                />
                {draft.mode === 'flat' && (
                  <div className="hint">Service au forfait : {euros(draft.unitPrice)}.</div>
                )}
              </div>
              <button className="btn btn-dark btn-block" onClick={goPay}>
                Continuer vers le paiement
              </button>
            </>
          )}

          {step === 'pay' && draft && (
            <>
              <button className="modal-close" onClick={close} aria-label="Fermer">
                ✕
              </button>
              <h2>Paiement sécurisé</h2>
              <p className="sub">Étape 2 sur 2 — les fonds sont bloqués jusqu&apos;à la livraison.</p>
              <div className="order-line">
                <span>Mission</span>
                <span>{draft.titre}</span>
              </div>
              <div className="order-line">
                <span>
                  {draft.mode === 'jour'
                    ? `${draft.jours} jour${draft.jours > 1 ? 's' : ''} × ${euros(draft.unitPrice)}`
                    : 'Forfait service'}
                </span>
                <span>{euros(montant)}</span>
              </div>
              <div className="order-line">
                <span>Frais de service (10 %)</span>
                <span>{euros(commission)}</span>
              </div>
              <div className="order-line total">
                <span>Total à payer</span>
                <span>{euros(total)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '18px 0' }} />
              <div className="field">
                <label>Numéro de carte</label>
                <input type="text" defaultValue="4242 4242 4242 4242" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Expiration</label>
                  <input type="text" defaultValue="12/27" />
                </div>
                <div className="field">
                  <label>CVC</label>
                  <input type="text" defaultValue="123" />
                </div>
              </div>
              <button className="btn btn-dark btn-block" onClick={pay} disabled={submitting}>
                {submitting ? 'Paiement…' : `Payer ${euros(total)}`}
              </button>
              <p style={{ fontSize: '.7rem', color: 'var(--gray-500)', textAlign: 'center', marginTop: 12 }}>
                Prototype — aucun paiement réel n&apos;est effectué.
              </p>
            </>
          )}

          {step === 'success' && draft && (
            <div className="center">
              <div className="success-icon">✓</div>
              <h2>Paiement confirmé !</h2>
              <p className="sub" style={{ marginTop: 8 }}>
                Les fonds sont sécurisés. {freelanceNom} a été notifié(e) et reçoit son paiement sur
                son Mobile Money dès que vous validez la livraison.
              </p>
              <button
                className="btn btn-dark btn-block"
                onClick={() => {
                  router.push('/dashboard');
                }}
              >
                Suivre ma mission
              </button>
            </div>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}
