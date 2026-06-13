'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PAYS_AFRIQUE } from '@/lib/constants';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import PasswordInput from '@/components/PasswordInput';

type Role = 'CLIENT' | 'FREELANCE';

export default function RegisterForm() {
  const params = useSearchParams();
  const [supabase] = useState(() => createBrowserSupabase());
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
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          prenom: prenom.trim(),
          role,
          pays: role === 'FREELANCE' ? pays : '',
          telephoneMomo: role === 'FREELANCE' ? momo.trim() : '',
        },
      },
    });
    setLoading(false);

    if (err) {
      setError(
        err.message.includes('already registered')
          ? 'Un compte existe déjà avec cette adresse e-mail.'
          : err.message
      );
      return;
    }
    // Email de confirmation envoyé (pas de session tant que non confirmé).
    if (data.user && !data.session) {
      setSent(true);
      return;
    }
    // Cas où la confirmation serait désactivée : session immédiate.
    window.location.href = '/dashboard';
  }

  if (sent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card center">
          <div className="success-icon" style={{ background: 'var(--green)' }}>
            ✉️
          </div>
          <h1>Vérifiez votre e-mail</h1>
          <p className="sub" style={{ marginTop: 8 }}>
            Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour
            activer votre compte, puis connectez-vous.
          </p>
          <Link className="btn btn-dark btn-block" href="/connexion" style={{ marginTop: 12 }}>
            Aller à la connexion
          </Link>
          <p className="auth-alt" style={{ marginTop: 16 }}>
            Pas reçu ? Vérifiez vos spams, ou réinscrivez-vous pour renvoyer le lien.
          </p>
        </div>
      </div>
    );
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
            <PasswordInput
              id="password"
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
