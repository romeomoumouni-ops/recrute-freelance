'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Ban } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function BannedOverlay() {
  const [banned, setBanned] = useState(false);
  const pathname = usePathname();

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      const me = await res.json();
      setBanned(!!me.authenticated && me.banni === true);
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

  if (!banned) return null;

  return (
    <div className="banned-overlay">
      <div className="banned-card">
        <div className="banned-ic">
          <Ban size={44} />
        </div>
        <h1>Compte suspendu</h1>
        <p>
          Votre compte a été suspendu pour non-respect des conditions d&apos;utilisation de
          recrutefreelance.com (notamment toute tentative de contact ou de paiement en dehors de la
          plateforme).
        </p>
        <p className="banned-contact">
          Une erreur ? Contactez{' '}
          <a href="mailto:support@recrutefreelance.com">support@recrutefreelance.com</a>.
        </p>
        <button className="btn btn-dark btn-block" onClick={signOut}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
