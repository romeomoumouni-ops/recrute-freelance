'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { VerifCheck } from '@/lib/verification';
import { OPERATEURS_MOMO, OPERATEUR_CODE, OPERATEUR_LABEL, PAYS_AFRIQUE } from '@/lib/constants';
import { toast } from '@/lib/toast';

type Role = 'CLIENT' | 'FREELANCE';
type Tab = 'verification' | 'compte' | 'paiement' | 'notifications';

interface NotifPrefs {
  messages: boolean;
  missions: boolean;
  paiements: boolean;
  newsletter: boolean;
}

export default function ParametresClient({
  role,
  compte,
  momo,
  checks: initialChecks,
  notifs,
}: {
  role: Role;
  compte: { prenom: string; email: string; pays: string };
  momo: { telephoneMomo: string; operateurMomo: string };
  checks: VerifCheck[];
  notifs: NotifPrefs;
}) {
  const router = useRouter();
  const tabs: [Tab, string][] =
    role === 'FREELANCE'
      ? [
          ['verification', 'Vérification du profil'],
          ['compte', 'Compte'],
          ['paiement', 'Paiement'],
          ['notifications', 'Notifications'],
        ]
      : [
          ['compte', 'Compte'],
          ['notifications', 'Notifications'],
        ];
  const [tab, setTab] = useState<Tab>(tabs[0][0]);
  const navRef = useRef<HTMLDivElement>(null);

  // Checklist de vérification : on recalcule TOUJOURS l'état frais côté client
  // (la page serveur peut être servie en cache et afficher une progression figée).
  const [checks, setChecks] = useState<VerifCheck[]>(initialChecks);
  const refreshChecks = () => {
    if (role !== 'FREELANCE') return;
    fetch('/api/verification', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.checks) && d.checks.length) setChecks(d.checks);
      })
      .catch(() => {});
  };
  // Au montage + à chaque fois qu'on ouvre l'onglet Vérification.
  useEffect(() => {
    if (tab === 'verification') refreshChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Sur mobile, amène l'onglet actif dans le champ de vision.
  useEffect(() => {
    const el = navRef.current?.querySelector('button.active') as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [tab]);

  // compte state
  const [prenom, setPrenom] = useState(compte.prenom);
  const [email, setEmail] = useState(compte.email);
  const [pays, setPays] = useState(compte.pays);
  // momo state
  const [tel, setTel] = useState(momo.telephoneMomo);
  const [op, setOp] = useState(momo.operateurMomo);
  // notifs state
  const [prefs, setPrefs] = useState<NotifPrefs>(notifs);

  const faits = checks.filter((c) => c.ok).length;
  const pct = checks.length ? Math.round((faits / checks.length) * 100) : 0;
  const verifie = checks.length > 0 && faits === checks.length;

  async function saveCompte() {
    const res = await fetch('/api/parametres', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'compte', prenom, email, pays }),
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Erreur.');
    toast('Compte mis à jour ✓');
    router.refresh();
  }

  async function saveMomo() {
    const res = await fetch('/api/parametres', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'momo',
        telephoneMomo: tel,
        operateurMomo: op || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Erreur.');
    toast('Numéro Mobile Money enregistré ✓');
    refreshChecks();
    router.refresh();
  }

  async function toggleNotif(key: keyof NotifPrefs, val: boolean) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    await fetch('/api/parametres', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'notifs', ...next }),
    });
    toast('Préférence enregistrée ✓');
  }

  return (
    <div className="container settings-layout">
      <div className="settings-nav" ref={navRef}>
        {tabs.map(([id, label]) => (
          <button key={id} className={id === tab ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="settings-panel">
        {tab === 'verification' && (
          <>
            <h2>Vérification du profil</h2>
            <p className="sub">
              Complétez ces étapes pour obtenir le badge <strong>« Freelance approuvé »</strong> et
              apparaître en priorité dans les résultats.
            </p>
            {verifie ? (
              <div className="verif-banner ok">
                <span className="big">✓</span>
                <span>
                  Votre profil est <strong>vérifié par recrutefreelance.com</strong>. Le badge
                  « Freelance approuvé » est visible sur votre profil.
                </span>
              </div>
            ) : (
              <div className="verif-banner pending">
                <span className="big">⏳</span>
                <span>
                  Profil <strong>en attente de vérification</strong> — {faits} / {checks.length}{' '}
                  critères remplis.
                </span>
              </div>
            )}
            <div className="progress-bar">
              <div style={{ width: `${pct}%` }} />
            </div>
            <div className="check-list">
              {checks.map((c) => (
                <div className="check-item" key={c.key}>
                  <div className={`check-icon ${c.ok ? 'done' : 'todo'}`}>{c.ok ? '✓' : '•'}</div>
                  <div className="txt">
                    <div className="titre">{c.titre}</div>
                    <div className="desc">{c.desc}</div>
                  </div>
                  {!c.ok && <Link href={c.lien}>Compléter →</Link>}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'compte' && (
          <>
            <h2>Compte</h2>
            <p className="sub">Vos informations personnelles.</p>
            <div className="field">
              <label>Prénom</label>
              <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>
            <div className="field">
              <label>Adresse e-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {role === 'FREELANCE' && (
              <div className="field">
                <label>Pays</label>
                <select value={pays} onChange={(e) => setPays(e.target.value)}>
                  <option value="">—</option>
                  {PAYS_AFRIQUE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <label>Type de compte</label>
              <input
                type="text"
                disabled
                value={role === 'CLIENT' ? 'Entreprise / Client' : 'Freelance'}
              />
            </div>
            <button className="btn btn-dark" onClick={saveCompte}>
              Enregistrer
            </button>
          </>
        )}

        {tab === 'paiement' && role === 'FREELANCE' && (
          <>
            <h2>Paiement</h2>
            <p className="sub">C&apos;est ici que vous recevez vos gains.</p>
            <div className="field">
              <label>Numéro Mobile Money</label>
              <input
                type="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="+229 01 90 00 00 00"
              />
              <div className="hint">Orange Money, MTN MoMo, Wave ou Moov Money.</div>
            </div>
            <div className="field">
              <label>Opérateur</label>
              <select value={op} onChange={(e) => setOp(e.target.value)}>
                <option value="">—</option>
                {OPERATEURS_MOMO.map((label) => (
                  <option key={label} value={OPERATEUR_CODE[label]}>
                    {label}
                  </option>
                ))}
              </select>
              {op && <div className="hint">Sélectionné : {OPERATEUR_LABEL[op]}</div>}
            </div>
            <button className="btn btn-dark" onClick={saveMomo}>
              Enregistrer
            </button>
          </>
        )}

        {tab === 'notifications' && (
          <>
            <h2>Notifications</h2>
            <p className="sub">Choisissez ce que vous recevez par e-mail.</p>
            {(
              [
                ['messages', 'Nouveaux messages', 'Recevoir un e-mail quand on vous écrit.'],
                ['missions', 'Missions', 'Nouvelles commandes, livraisons et validations.'],
                ['paiements', 'Paiements', 'Confirmations de paiement et de retrait Mobile Money.'],
                ['newsletter', 'Newsletter', 'Conseils et nouveautés de la plateforme.'],
              ] as [keyof NotifPrefs, string, string][]
            ).map(([id, titre, desc]) => (
              <div className="switch-row" key={id}>
                <div>
                  <div className="titre">{titre}</div>
                  <div className="desc">{desc}</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={prefs[id]}
                    onChange={(e) => toggleNotif(id, e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
