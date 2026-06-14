import type { Metadata } from 'next';
import Link from 'next/link';
import { Ban } from 'lucide-react';

export const metadata: Metadata = { title: 'Compte suspendu' };

export default function CompteSuspendu() {
  return (
    <div className="container" style={{ maxWidth: 520, padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: '#c0392b' }}><Ban size={44} /></div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '14px 0 10px' }}>Compte suspendu</h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '.9rem', lineHeight: 1.6 }}>
        Votre compte a été suspendu pour non-respect des conditions d&apos;utilisation de la
        plateforme (notamment toute tentative de contact ou de paiement en dehors de
        recrutefreelance.com).
        <br />
        <br />
        Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez le support à{' '}
        <a href="mailto:support@recrutefreelance.com" style={{ textDecoration: 'underline' }}>
          support@recrutefreelance.com
        </a>
        .
      </p>
      <Link className="btn btn-outline" href="/" style={{ marginTop: 24 }}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
