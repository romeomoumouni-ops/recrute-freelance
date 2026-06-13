'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PAYS_AFRIQUE } from '@/lib/constants';

type Role = 'CLIENT' | 'FREELANCE';

export default function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<Role>(
    params.get('role') === 'freelance' ? 'FREELANCE' : 'CLIENT'
  );
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pays, setPays] = useState(PAYS_AFRIQUE[0]);
  const [momo, setMomo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom,
          email,
          password,
          role,
          pays: role === 'FREELANCE' ? pays : undefined,
          telephoneMomo: role === 'FREELANCE' ? momo : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.');
        setLoading(false);
        return;
      }
      // Connexion automatique
      const signin = await signIn('credentials', { email, password, redirect: false });
      if (signin?.error) {
        setError('Compte créé, mais connexion impossible. Connectez-vous manuellement.');
        setLoading(false);
        return;
      }
      const toast = encodeURIComponent(`Bienvenue ${prenom} ! Votre compte est créé. 🎉`);
      router.push(`/dashboard?toast=${toast}`);
      router.refresh();
    } catch {
      setError('Une erreur réseau est survenue.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Créer un compte</h1>
        <p className="sub">Gratuit, en moins d&apos;une minute.</p>

        <div className="role-switch">
          <button
            type="button"
            className={role === 'CLIENT' ? 'active' : ''}
            onClick={() => setRole('CLIENT')}
          >
            🏢 Je suis une entreprise
          </button>
          <button
            type="button"
            className={role === 'FREELANCE' ? 'active' : ''}
            onClick={() => setRole('FREELANCE')}
          >
            💼 Je suis freelance
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="prenom">Prénom</label>
            <input
              id="prenom"
              type="text"
              required
              placeholder="Ex : Romeo"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
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
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {role === 'FREELANCE' && (
            <>
              <div className="field">
                <label htmlFor="pays">Pays</label>
                <select id="pays" value={pays} onChange={(e) => setPays(e.target.value)}>
                  {PAYS_AFRIQUE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="momo">Numéro Mobile Money</label>
                <input
                  id="momo"
                  type="tel"
                  placeholder="+229 01 90 00 00 00"
                  value={momo}
                  onChange={(e) => setMomo(e.target.value)}
                />
                <div className="hint">C&apos;est sur ce numéro que vous recevrez vos paiements.</div>
              </div>
            </>
          )}

          <button className="btn btn-dark btn-block" type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-alt">
          Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
