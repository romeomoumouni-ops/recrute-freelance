'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Clock, Wallet } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

interface AbonnementInfo {
  active: boolean;
  mode: 'trial' | 'paid' | 'expired';
  daysLeft: number;
}

export default function AbonnementGate() {
  const [abo, setAbo] = useState<AbonnementInfo | null>(null);
  const [url, setUrl] = useState('');
  const pathname = usePathname();

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      const me = await res.json();
      if (me.authenticated && me.role === 'FREELANCE' && me.abonnement) {
        setAbo(me.abonnement as AbonnementInfo);
        setUrl(me.abonnementUrl || '');
      } else {
        setAbo(null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    check();
    const i = setInterval(check, 8000);
    return () => clearInterval(i);
  }, [check, pathname]);

  async function signOut() {
    try {
      await createBrowserSupabase().auth.signOut();
    } catch {
      /* ignore */
    }
    window.location.href = '/';
  }

  function pay() {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = '/aide';
  }

  if (!abo) return null;

  // Essai en cours mais bientôt fini : bandeau d'alerte en haut (non bloquant).
  if (abo.active && abo.mode === 'trial' && abo.daysLeft <= 3) {
    return (
      <div className="abo-banner">
        <Clock size={16} />
        <span>
          {abo.daysLeft <= 1
            ? "Dernier jour de votre essai gratuit."
            : `Plus que ${abo.daysLeft} jours d'essai gratuit.`}{' '}
          Abonnez-vous (20&nbsp;000 FCFA/mois) pour ne pas perdre l'accès.
        </span>
        <button className="abo-banner-btn" onClick={pay}>
          S&apos;abonner
        </button>
      </div>
    );
  }

  // Essai terminé : blocage total.
  if (!abo.active) {
    return (
      <div className="banned-overlay">
        <div className="banned-card">
          <div className="banned-ic" style={{ background: '#0d0d0d', color: '#fff' }}>
            <Wallet size={40} />
          </div>
          <h1>Votre essai gratuit est terminé</h1>
          <p>
            Vos <strong>7 jours d&apos;essai gratuits</strong> sont écoulés. Pour continuer à utiliser
            recrutefreelance.com — recevoir des missions, échanger avec les clients et apparaître dans la
            recherche — abonnez-vous pour <strong>20&nbsp;000 FCFA/mois</strong>.
          </p>
          <button className="btn btn-dark btn-block" onClick={pay} style={{ marginTop: 6 }}>
            Payer 20&nbsp;000 FCFA/mois
          </button>
          <p className="banned-contact" style={{ marginTop: 14 }}>
            Déjà payé&nbsp;? Votre compte est réactivé après confirmation. Une question&nbsp;?{' '}
            <a href="mailto:support@recrutefreelance.com">support@recrutefreelance.com</a>.
          </p>
          <button
            className="btn btn-outline btn-block"
            onClick={signOut}
            style={{ marginTop: 10 }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return null;
}
