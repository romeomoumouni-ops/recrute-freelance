'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { initiales, euros } from '@/lib/utils';
import { getVerifChecks } from '@/lib/verification';
import { CATEGORIES_LIST } from '@/lib/constants';
import { toast } from '@/lib/toast';

interface Service {
  id: string;
  titre: string;
  description: string;
  prix: number;
  delaiJours: number;
}
interface PortfolioItem {
  id: string;
  imageUrl: string;
}

interface Initial {
  photoUrl: string | null;
  titre: string;
  bio: string;
  note: string;
  cat: string;
  skills: string[];
  cvName: string | null;
  services: Service[];
  portfolio: PortfolioItem[];
}

export default function ProfilEditor({
  prenom,
  telephoneMomo,
  initial,
}: {
  prenom: string;
  telephoneMomo: string | null;
  initial: Initial;
}) {
  const [photo, setPhoto] = useState(initial.photoUrl);
  const [titre, setTitre] = useState(initial.titre);
  const [bio, setBio] = useState(initial.bio);
  const [note, setNote] = useState(initial.note);
  const [cat, setCat] = useState(initial.cat);
  const [skills, setSkills] = useState<string[]>(initial.skills);
  const [services, setServices] = useState<Service[]>(initial.services);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initial.portfolio);
  const [cvName, setCvName] = useState(initial.cvName);

  const [skillInput, setSkillInput] = useState('');
  const [sTitre, setSTitre] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sPrix, setSPrix] = useState('');
  const [sDelai, setSDelai] = useState('');

  const photoInput = useRef<HTMLInputElement>(null);
  const pfInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);

  const checks = getVerifChecks({
    photoUrl: photo,
    titre,
    bio,
    skills: JSON.stringify(skills),
    cvUrl: cvName,
    portfolioCount: portfolio.length,
    servicesCount: services.length,
    telephoneMomo,
  });
  const faits = checks.filter((c) => c.ok).length;

  // ----- Persistance du texte (titre/bio/skills/cat) -----
  async function persistProfile(next?: { skills?: string[]; cat?: string }) {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre,
        bio,
        note,
        skills: next?.skills ?? skills,
        cat: next?.cat ?? cat,
      }),
    });
    return res.ok;
  }

  async function saveAll() {
    const ok = await persistProfile();
    toast(ok ? 'Profil enregistré ✓' : 'Erreur lors de l’enregistrement.');
  }

  // ----- Photo -----
  async function uploadPhoto(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/profile/photo', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Échec de l’envoi.');
    setPhoto(data.photoUrl);
    toast('Photo de profil ajoutée ✓');
  }
  async function supprPhoto() {
    const res = await fetch('/api/profile/photo', { method: 'DELETE' });
    if (res.ok) setPhoto(null);
  }

  // ----- Compétences -----
  async function addSkill() {
    const v = skillInput.trim();
    if (!v) return;
    const next = [...skills, v];
    setSkills(next);
    setSkillInput('');
    await persistProfile({ skills: next });
  }
  async function removeSkill(i: number) {
    const next = skills.filter((_, idx) => idx !== i);
    setSkills(next);
    await persistProfile({ skills: next });
  }

  async function changeCat(value: string) {
    setCat(value);
    await persistProfile({ cat: value });
  }

  // ----- Services -----
  async function addService() {
    const prix = Number(sPrix);
    if (!sTitre.trim() || !prix) {
      toast('Indiquez au moins un titre et un prix.');
      return;
    }
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: sTitre.trim(),
        description: sDesc.trim(),
        prix,
        delaiJours: sDelai ? Number(sDelai) : 7,
      }),
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Erreur.');
    setServices([...services, data.service]);
    setSTitre('');
    setSDesc('');
    setSPrix('');
    setSDelai('');
    toast('Service ajouté ✓');
  }
  async function removeService(id: string) {
    const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
    if (res.ok) setServices(services.filter((s) => s.id !== id));
  }

  // ----- Portfolio -----
  async function uploadPortfolio(files: FileList) {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f));
    const res = await fetch('/api/profile/portfolio', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Échec de l’envoi.');
    setPortfolio([...portfolio, ...data.items]);
    toast('Image(s) ajoutée(s) au portfolio ✓');
  }
  async function removePf(id: string) {
    const res = await fetch(`/api/profile/portfolio?id=${id}`, { method: 'DELETE' });
    if (res.ok) setPortfolio(portfolio.filter((p) => p.id !== id));
  }

  // ----- CV -----
  async function uploadCV(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/profile/cv', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Échec de l’envoi.');
    setCvName(data.cvName);
    toast('CV chargé ✓');
  }
  async function removeCV() {
    const res = await fetch('/api/profile/cv', { method: 'DELETE' });
    if (res.ok) setCvName(null);
  }

  const bioLen = bio.length;

  return (
    <div className="container profil-edit">
      <h1>Mon profil</h1>
      <p className="sub">
        C&apos;est ce que les clients verront. Plus il est complet, plus vite vous serez{' '}
        <strong>vérifié ✓</strong>.
      </p>

      {/* Photo */}
      <div className="edit-card">
        <h2>Photo de profil</h2>
        <div className="photo-row">
          <div className="photo-preview">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" />
            ) : (
              initiales(prenom)
            )}
          </div>
          <div>
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
            />
            <button className="btn btn-dark" onClick={() => photoInput.current?.click()}>
              Charger une photo
            </button>
            {photo && (
              <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={supprPhoto}>
                Supprimer
              </button>
            )}
            <div className="hint" style={{ marginTop: 10 }}>
              JPG ou PNG, visage visible de préférence.
            </div>
          </div>
        </div>
      </div>

      {/* Présentation */}
      <div className="edit-card">
        <h2>Présentation</h2>
        <div className="field">
          <label>Titre professionnel</label>
          <input
            type="text"
            placeholder="Ex : Développeur Web Full-Stack"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Catégorie principale</label>
          <select value={cat} onChange={(e) => changeCat(e.target.value)}>
            <option value="">Choisir une catégorie…</option>
            {CATEGORIES_LIST.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea
            rows={5}
            placeholder="Présentez votre parcours, vos spécialités, vos résultats… (50 caractères minimum pour la vérification)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="hint">
            {bioLen} caractère{bioLen > 1 ? 's' : ''}
            {bioLen < 50 ? ` — encore ${50 - bioLen} pour la vérification` : ' ✓'}
          </div>
        </div>
        <div className="field">
          <label>Un mot pour vos clients (note)</label>
          <textarea
            rows={2}
            maxLength={280}
            placeholder="Ex : Disponible dès la semaine prochaine · Réponse sous 2h · Première mission -10 %…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="hint">
            Ce petit mot s&apos;affiche en haut de votre profil public. {note.length}/280
          </div>
        </div>
      </div>

      {/* Compétences */}
      <div className="edit-card">
        <h2>Compétences</h2>
        <div className="skill-input-row field" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Ex : React, Figma, SEO…"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <button className="btn btn-dark" type="button" onClick={addSkill}>
            Ajouter
          </button>
        </div>
        <div className="skills-edit">
          {skills.length ? (
            skills.map((s, i) => (
              <span className="badge" key={`${s}-${i}`}>
                {s} <button onClick={() => removeSkill(i)}>✕</button>
              </span>
            ))
          ) : (
            <span style={{ fontSize: '.78rem', color: 'var(--gray-500)' }}>
              Aucune compétence ajoutée.
            </span>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="edit-card">
        <h2>Mes services</h2>
        <div>
          {services.map((s) => (
            <div className="service-item" key={s.id}>
              <div>
                <div className="titre">{s.titre}</div>
                <div className="desc">{s.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="prix">{euros(s.prix)}</div>
                <button className="suppr" onClick={() => removeService(s.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="field">
          <label>Titre du service</label>
          <input
            type="text"
            placeholder="Ex : Création de site vitrine WordPress"
            value={sTitre}
            onChange={(e) => setSTitre(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            rows={2}
            placeholder="Ce que le client obtient, délais, révisions…"
            value={sDesc}
            onChange={(e) => setSDesc(e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Prix (€)</label>
            <input
              type="number"
              min={1}
              placeholder="Ex : 450"
              value={sPrix}
              onChange={(e) => setSPrix(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Délai (jours)</label>
            <input
              type="number"
              min={1}
              placeholder="Ex : 7"
              value={sDelai}
              onChange={(e) => setSDelai(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-outline" onClick={addService}>
          + Ajouter ce service
        </button>
      </div>

      {/* Portfolio */}
      <div className="edit-card">
        <h2>Portfolio</h2>
        <input
          ref={pfInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files?.length && uploadPortfolio(e.target.files)}
        />
        <div className="upload-zone" onClick={() => pfInput.current?.click()}>
          📁 <strong>Cliquez pour ajouter des images</strong>
          <br />
          de vos réalisations (2 minimum pour la vérification)
        </div>
        {portfolio.length > 0 && (
          <div className="portfolio-grid">
            {portfolio.map((p) => (
              <div className="portfolio-item" key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt="" />
                <button onClick={() => removePf(p.id)} aria-label="Supprimer">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CV */}
      <div className="edit-card">
        <h2>CV</h2>
        <input
          ref={cvInput}
          type="file"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={(e) => e.target.files?.[0] && uploadCV(e.target.files[0])}
        />
        <div className="upload-zone" onClick={() => cvInput.current?.click()}>
          📄 <strong>Cliquez pour charger votre CV</strong>
          <br />
          PDF ou Word
        </div>
        {cvName && (
          <div className="cv-file">
            📄 {cvName}
            <button onClick={removeCV} aria-label="Supprimer">
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="save-bar">
        <span>
          {faits === checks.length ? (
            <>
              ✓ Profil complet —{' '}
              <Link href="/parametres">vérifié</Link>
            </>
          ) : (
            <>
              {faits} / {checks.length} critères de <Link href="/parametres">vérification</Link>{' '}
              remplis
            </>
          )}
        </span>
        <button className="btn btn-light" onClick={saveAll}>
          Enregistrer mon profil
        </button>
      </div>
    </div>
  );
}
