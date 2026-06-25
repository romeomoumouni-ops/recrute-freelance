'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Clock, Wallet, Check, PauseCircle, ChevronDown } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

interface AbonnementInfo {
  active: boolean;
  mode: 'trial' | 'paid' | 'expired';
  daysLeft: number;
}

// Ce qui est conservé / en pause quand le compte n'est plus abonné.
function WhatHappens() {
  return (
    <div className="abo-info">
      <div className="abo-info-h ok">
        <Check size={15} /> Ce qui est conservé
      </div>
      <ul>
        <li>Vos conversations et tout votre historique de messages</li>
        <li>Vos fonds et votre solde restent à vous, en sécurité</li>
        <li>Votre profil, vos services et vos réalisations</li>
      </ul>
      <div className="abo-info-h pause">
        <PauseCircle size={15} /> En pause tant que vous n&apos;êtes pas abonné
      </div>
      <ul>
        <li>Votre profil n&apos;apparaît plus dans «&nbsp;Trouver un freelance&nbsp;»</li>
        <li>Vous ne pouvez plus envoyer de messages aux clients</li>
        <li>Vous ne recevez plus de nouvelles missions et ne pouvez pas retirer vos fonds</li>
      </ul>
      <p className="abo-info-foot">Tout redevient actif instantanément dès que vous vous abonnez.</p>
    </div>
  );
}

export default function AbonnementGate() {
  const [abo, setAbo] = useState<AbonnementInfo | null>(null);
  const [url, setUrl] = useState('');
  const [showDetails, setShowDetails] = useState(false);
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
      <div className="abo-banner-wrap">
        <div className="abo-banner">
          <Clock size={16} />
          <span>
            {abo.daysLeft <= 1
              ? 'Dernier jour de votre essai gratuit.'
              : `Plus que ${abo.daysLeft} jours d'essai gratuit.`}{' '}
            Abonnez-vous (20&nbsp;000 FCFA/mois) pour garder votre accès.
          </span>
          <button className="abo-banner-link" onClick={() => setShowDetails((v) => !v)}>
            Que se passe-t-il à expiration&nbsp;? <ChevronDown size={13} style={{ transform: showDetails ? 'rotate(180deg)' : 'none' }} />
          </button>
          <button className="abo-banner-btn" onClick={pay}>
            S&apos;abonner
          </button>
        </div>
        {showDetails && (
          <div className="abo-banner-details">
            <WhatHappens />
          </div>
        )}
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
            Vos <strong>7 jours d&apos;essai gratuits</strong> sont écoulés. Pour continuer à recevoir des
            missions, échanger avec les clients et rester visible dans la recherche, abonnez-vous pour{' '}
            <strong>20&nbsp;000 FCFA/mois</strong>.
          </p>

          <WhatHappens />

          <button className="btn btn-dark btn-block" onClick={pay} style={{ marginTop: 14 }}>
            Payer 20&nbsp;000 FCFA/mois
          </button>
          <p className="banned-contact" style={{ marginTop: 14 }}>
            Déjà payé&nbsp;? Votre compte est réactivé après confirmation. Une question&nbsp;?{' '}
            <a href="mailto:support@recrutefreelance.com">support@recrutefreelance.com</a>.
          </p>
          <button className="btn btn-outline btn-block" onClick={signOut} style={{ marginTop: 10 }}>
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return null;
}
