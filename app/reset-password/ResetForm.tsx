'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import PasswordInput from '@/components/PasswordInput';
import { toast } from '@/lib/toast';

export default function ResetForm() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabase());
  const [ready, setReady] = useState<boolean | null>(null); // null = vérification en cours
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Le lien de réinitialisation établit une session de récupération via /auth/callback.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setReady(!!data.user));
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast('Mot de passe mis à jour ✓');
    router.push('/dashboard');
    router.refresh();
  }

  if (ready === false) {
    return (
      <div className="auth-wrap">
        <div className="auth-card center">
          <h1>Lien expiré</h1>
          <p className="sub" style={{ marginTop: 8 }}>
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link className="btn btn-dark btn-block" href="/mot-de-passe-oublie" style={{ marginTop: 12 }}>
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Nouveau mot de passe</h1>
        <p className="sub">Choisissez un nouveau mot de passe pour votre compte.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="password">Nouveau mot de passe</label>
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
          <div className="field">
            <label htmlFor="confirm">Confirmer le mot de passe</label>
            <PasswordInput
              id="confirm"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Retapez le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button className="btn btn-dark btn-block" type="submit" disabled={loading || ready === null}>
            {loading ? 'Enregistrement…' : 'Mettre à jour'}
          </button>
        </form>
      </div>
    </div>
  );
}
