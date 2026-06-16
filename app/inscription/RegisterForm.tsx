'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Building2, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';
import { PAYS_AFRIQUE } from '@/lib/constants';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import PasswordInput from '@/components/PasswordInput';

type Role = 'CLIENT' | 'FREELANCE';
type Step = 'choose' | 'form';

export default function RegisterForm() {
  const params = useSearchParams();
  const [supabase] = useState(() => createBrowserSupabase());

  const roleParam = params.get('role');
  const initialRole: Role | null =
    roleParam === 'freelance' ? 'FREELANCE' : roleParam === 'client' ? 'CLIENT' : null;

  const [role, setRole] = useState<Role>(initialRole ?? 'CLIENT');
  const [step, setStep] = useState<Step>(initialRole ? 'form' : 'choose');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pays, setPays] = useState(PAYS_AFRIQUE[0]);
  const [momo, setMomo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function chooseRole(r: Role) {
    setRole(r);
    setError('');
    setStep('form');
  }

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
    if (data.user && !data.session) {
      setSent(true);
      return;
    }
    window.location.href = '/dashboard';
  }

  // --- Écran de confirmation e-mail ---
  if (sent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card center">
          <div className="success-icon" style={{ background: 'var(--green)' }}>
            <Mail size={30} />
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

  // --- Étape 1 : choix du profil ---
  if (step === 'choose') {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Créer un compte</h1>
          <p className="sub">Pour commencer, dites-nous qui vous êtes.</p>

          <div className="role-choice">
            <button type="button" className="role-choice-card" onClick={() => chooseRole('CLIENT')}>
              <span className="rc-ic"><Building2 size={24} /></span>
              <strong>Je suis une entreprise</strong>
              <span className="rc-desc">Je veux engager des freelances</span>
              <span className="rc-go">Continuer <ArrowRight size={15} /></span>
            </button>
            <button type="button" className="role-choice-card" onClick={() => chooseRole('FREELANCE')}>
              <span className="rc-ic"><Briefcase size={24} /></span>
              <strong>Je suis un freelance africain</strong>
              <span className="rc-desc">Je veux trouver des missions</span>
              <span className="rc-go">Continuer <ArrowRight size={15} /></span>
            </button>
          </div>

          <p className="auth-alt">
            Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
          </p>
        </div>
      </div>
    );
  }

  // --- Étape 2 : formulaire selon le profil ---
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <button type="button" className="auth-back" onClick={() => { setStep('choose'); setError(''); }}>
          <ArrowLeft size={15} /> Changer de profil
        </button>
        <h1>{role === 'CLIENT' ? 'Compte entreprise' : 'Compte freelance'}</h1>
        <p className="sub">
          {role === 'CLIENT'
            ? 'Pour engager des freelances. Gratuit, en moins d’une minute.'
            : 'Pour trouver des missions. Gratuit, en moins d’une minute.'}
        </p>

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
