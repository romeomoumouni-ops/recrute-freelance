'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function ForgotForm() {
  const [supabase] = useState(() => createBrowserSupabase());
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError("Impossible d'envoyer l'e-mail. Vérifiez l'adresse.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card center">
          <div className="success-icon" style={{ background: 'var(--green)' }}>
            <Mail size={30} />
          </div>
          <h1>Vérifiez votre e-mail</h1>
          <p className="sub" style={{ marginTop: 8 }}>
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient
            d&apos;être envoyé. Cliquez dessus pour choisir un nouveau mot de passe.
          </p>
          <Link className="btn btn-dark btn-block" href="/connexion" style={{ marginTop: 12 }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Mot de passe oublié</h1>
        <p className="sub">Entrez votre e-mail, on vous envoie un lien de réinitialisation.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn btn-dark btn-block" type="submit" disabled={loading}>
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="auth-alt">
          <Link href="/connexion">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
