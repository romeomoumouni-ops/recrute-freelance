import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';

export const metadata: Metadata = { title: 'Inscription confirmée' };

export default function InscriptionConfirmeePage() {
  return (
    <div className="auth-wrap">
      <div className="auth-card center">
        <div className="success-icon"><Check size={30} /></div>
        <h1>Inscription confirmée !</h1>
        <p className="sub" style={{ marginTop: 8 }}>
          Votre adresse e-mail est validée. Connectez-vous avec vos identifiants pour accéder à la
          plateforme.
        </p>
        <Link className="btn btn-dark btn-block" href="/connexion" style={{ marginTop: 12 }}>
          Se connecter
        </Link>
      </div>
    </div>
  );
}
