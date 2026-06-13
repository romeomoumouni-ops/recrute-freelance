'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import PasswordInput from '@/components/PasswordInput';
import { toast } from '@/lib/toast';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [supabase] = useState(() => createBrowserSupabase());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNeedsConfirm(false);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (err) {
      if (err.message.toLowerCase().includes('not confirmed')) {
        setNeedsConfirm(true);
        setError("Votre e-mail n'est pas encore confirmé. Vérifiez votre boîte de réception.");
      } else {
        setError('E-mail ou mot de passe incorrect.');
      }
      return;
    }
    const callbackUrl = params.get('callbackUrl') || '/dashboard';
    router.push(callbackUrl);
    router.refresh();
  }

  async function resend() {
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    toast(err ? 'Impossible de renvoyer l’e-mail.' : 'E-mail de confirmation renvoyé ✓');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Se connecter</h1>
        <p className="sub">Heureux de vous revoir.</p>

        {error && <div className="form-error">{error}</div>}
        {needsConfirm && (
          <button
            type="button"
            className="btn btn-outline btn-block"
            style={{ marginBottom: 18 }}
            onClick={resend}
          >
            Renvoyer l&apos;e-mail de confirmation
          </button>
        )}

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
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <PasswordInput
              id="password"
              required
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-dark btn-block" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-alt" style={{ marginTop: 14 }}>
          <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </p>
        <p className="auth-alt">
          Pas encore de compte ? <Link href="/inscription">S&apos;inscrire gratuitement</Link>
        </p>
      </div>
    </div>
  );
}
