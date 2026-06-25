'use client';

import { useEffect, useState } from 'react';
import { Gift, CheckCircle2, AlertCircle } from 'lucide-react';

interface AbonnementInfo {
  active: boolean;
  mode: 'trial' | 'paid' | 'expired';
  daysLeft: number;
  validUntil: string | null;
}

function frDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Carte d'abonnement affichée au freelance : statut + bouton pour s'abonner quand il veut.
export default function AbonnementCard() {
  const [abo, setAbo] = useState<AbonnementInfo | null>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        const me = await res.json();
        if (me.authenticated && me.role === 'FREELANCE' && me.abonnement) {
          setAbo(me.abonnement as AbonnementInfo);
          setUrl(me.abonnementUrl || '');
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!abo) return null;

  function pay() {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = '/aide';
  }

  const payBtn = (label: string) => (
    <button className="btn btn-dark btn-sm" onClick={pay}>
      {label}
    </button>
  );

  if (abo.mode === 'paid') {
    return (
      <div className="abo-card paid">
        <div className="abo-card-ic"><CheckCircle2 size={20} /></div>
        <div className="abo-card-body">
          <strong>Abonnement actif</strong>
          <p>
            Votre accès est garanti jusqu&apos;au <strong>{abo.validUntil ? frDate(abo.validUntil) : '…'}</strong>.
            Vous pouvez le prolonger dès maintenant si vous le souhaitez.
          </p>
          {payBtn('Prolonger mon abonnement (20 000 FCFA/mois)')}
        </div>
      </div>
    );
  }

  if (abo.mode === 'trial') {
    return (
      <div className="abo-card trial">
        <div className="abo-card-ic"><Gift size={20} /></div>
        <div className="abo-card-body">
          <strong>Essai gratuit : il vous reste {abo.daysLeft} jour{abo.daysLeft > 1 ? 's' : ''}</strong>
          <p>
            Pas envie d&apos;attendre la fin des 7 jours&nbsp;? Vous pouvez vous abonner dès maintenant
            (20&nbsp;000 FCFA/mois, 0&nbsp;% de commission). Votre accès sera garanti sans interruption.
          </p>
          {payBtn('Je préfère m’abonner tout de suite →')}
        </div>
      </div>
    );
  }

  // expired (la modale bloquante s'affiche aussi par-dessus, mais on garde le bouton ici)
  return (
    <div className="abo-card expired">
      <div className="abo-card-ic"><AlertCircle size={20} /></div>
      <div className="abo-card-body">
        <strong>Essai terminé : accès bloqué</strong>
        <p>Abonnez-vous pour réactiver votre compte et continuer à recevoir des missions.</p>
        {payBtn('M’abonner (20 000 FCFA/mois)')}
      </div>
    </div>
  );
}
