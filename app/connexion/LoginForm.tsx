'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('E-mail ou mot de passe incorrect.');
      return;
    }
    const callbackUrl = params.get('callbackUrl') || '/dashboard';
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Se connecter</h1>
        <p className="sub">Heureux de vous revoir.</p>

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
          <span style={{ fontSize: '.72rem', color: 'var(--gray-500)' }}>
            Comptes de démo : client@test.com · freelance@test.com (mot de passe : test1234)
          </span>
        </p>

        <p className="auth-alt">
          Pas encore de compte ? <Link href="/inscription">S&apos;inscrire gratuitement</Link>
        </p>
      </div>
    </div>
  );
}
