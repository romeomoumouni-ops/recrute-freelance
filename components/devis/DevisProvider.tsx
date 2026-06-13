'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { euros } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface ServiceLite {
  id: string;
  titre: string;
  prix: number;
}

interface DevisCtx {
  isLogged: boolean;
  request: (service?: ServiceLite) => void;
}

const Ctx = createContext<DevisCtx | null>(null);
export function useDevis() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDevis must be used within DevisProvider');
  return c;
}

export default function DevisProvider({
  freelanceId,
  freelanceNom,
  isLogged,
  loginUrl,
  children,
}: {
  freelanceId: string;
  freelanceNom: string;
  isLogged: boolean;
  loginUrl: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<ServiceLite | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const request = useCallback(
    (svc?: ServiceLite) => {
      if (!isLogged) {
        router.push(`/connexion?callbackUrl=${encodeURIComponent(loginUrl)}`);
        return;
      }
      setService(svc ?? null);
      setDescription('');
      setOpen(true);
    },
    [isLogged, loginUrl, router]
  );

  async function send() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelanceId, serviceId: service?.id, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Impossible d’envoyer la demande.');
        setSubmitting(false);
        return;
      }
      router.push(`/messages?c=${data.conversationId}`);
    } catch {
      toast('Erreur réseau.');
      setSubmitting(false);
    }
  }

  return (
    <Ctx.Provider value={{ isLogged, request }}>
      {children}

      <div className={`modal-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer">
            ✕
          </button>
          <h2>Demander un devis</h2>
          <p className="sub">
            Décrivez votre besoin à {freelanceNom}. Votre demande s&apos;ouvrira dans la messagerie.
          </p>
          {service && (
            <div className="devis-recap">
              <span className="devis-recap-titre">📋 {service.titre}</span>
              <span className="devis-recap-prix">À partir de {euros(service.prix)}</span>
            </div>
          )}
          <div className="field">
            <label>Votre besoin</label>
            <textarea
              rows={4}
              placeholder="Décrivez votre projet, vos délais, votre budget…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button className="btn btn-dark btn-block" disabled={submitting} onClick={send}>
            {submitting ? 'Envoi…' : 'Envoyer ma demande'}
          </button>
        </div>
      </div>
    </Ctx.Provider>
  );
}
