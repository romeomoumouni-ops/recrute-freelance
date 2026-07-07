'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderUp, FileText, X, Check, Clock, ShieldCheck } from 'lucide-react';
import { initiales, euros } from '@/lib/utils';
import { getVerifChecks } from '@/lib/verification';
import type { ValidationStatus } from '@/lib/validation';
import { CATEGORIES_LIST } from '@/lib/constants';
import { toast } from '@/lib/toast';
import { compressImage } from '@/lib/image-compress';

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
  statutValidation,
  motifRejet,
  initial,
}: {
  prenom: string;
  telephoneMomo: string | null;
  statutValidation: ValidationStatus;
  motifRejet: string | null;
  initial: Initial;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
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

  // Édition d'un service existant
  const [editId, setEditId] = useState<string | null>(null);
  const [eTitre, setETitre] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [ePrix, setEPrix] = useState('');
  const [eDelai, setEDelai] = useState('');

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
  // Le CV est facultatif : la progression et la soumission ne comptent que les critères requis.
  const requis = checks.filter((c) => !c.optional);
  const faits = requis.filter((c) => c.ok).length;
  const tousRequisFaits = faits === requis.length;

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
    // Revalide les Server Components (profil public, aperçu, vérification) après écriture.
    if (res.ok) router.refresh();
    return res.ok;
  }

  async function saveAll() {
    const ok = await persistProfile();
    toast(ok ? 'Profil enregistré ✓' : 'Erreur lors de l’enregistrement.');
  }

  // ----- Demande de validation -----
  async function submitValidation() {
    setSubmitting(true);
    // On enregistre d'abord le texte courant pour ne rien perdre.
    await persistProfile();
    const res = await fetch('/api/profile/submit-validation', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) return toast(data.error || 'Soumission impossible.');
    toast(
      data.statut === 'APPROUVE'
        ? 'Profil validé ✓ Vous êtes désormais visible par les clients.'
        : 'Demande de validation envoyée ✓'
    );
    router.refresh();
  }

  // ----- Photo -----
  async function uploadPhoto(file: File) {
    const prev = photo;
    const localUrl = URL.createObjectURL(file);
    setPhoto(localUrl); // aperçu instantané pendant l'envoi
    try {
      const compressed = await compressImage(file, 512, 0.85);
      const fd = new FormData();
      fd.append('file', compressed);
      const res = await fetch('/api/profile/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setPhoto(prev);
        return toast(data.error || 'Échec de l’envoi.');
      }
      setPhoto(data.photoUrl);
      router.refresh();
      toast('Photo de profil ajoutée ✓');
    } catch {
      setPhoto(prev);
      toast('Échec de l’envoi.');
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  }
  async function supprPhoto() {
    const res = await fetch('/api/profile/photo', { method: 'DELETE' });
    if (res.ok) {
      setPhoto(null);
      router.refresh();
    }
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
    router.refresh();
    toast('Service ajouté ✓');
  }
  async function removeService(id: string) {
    const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setServices(services.filter((s) => s.id !== id));
      router.refresh();
    }
  }

  function startEdit(s: Service) {
    setEditId(s.id);
    setETitre(s.titre);
    setEDesc(s.description);
    setEPrix(String(s.prix));
    setEDelai(String(s.delaiJours));
  }
  async function saveEdit(id: string) {
    const prix = Number(ePrix);
    if (!eTitre.trim() || !prix) {
      toast('Indiquez au moins un titre et un prix.');
      return;
    }
    const res = await fetch('/api/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        titre: eTitre.trim(),
        description: eDesc.trim(),
        prix,
        delaiJours: eDelai ? Number(eDelai) : 7,
      }),
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Erreur.');
    setServices(services.map((s) => (s.id === id ? data.service : s)));
    setEditId(null);
    router.refresh();
    toast('Service modifié ✓');
  }

  // ----- Portfolio -----
  async function uploadPortfolio(files: FileList) {
    toast('Envoi des images…');
    try {
      const compressed = await Promise.all(
        Array.from(files).map((f) => compressImage(f, 1280, 0.82))
      );
      const fd = new FormData();
      compressed.forEach((f) => fd.append('files', f));
      const res = await fetch('/api/profile/portfolio', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) return toast(data.error || 'Échec de l’envoi.');
      setPortfolio([...portfolio, ...data.items]);
      router.refresh();
      toast('Image(s) ajoutée(s) au portfolio ✓');
    } catch {
      toast('Échec de l’envoi.');
    }
  }
  async function removePf(id: string) {
    const res = await fetch(`/api/profile/portfolio?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPortfolio(portfolio.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  // ----- CV -----
  async function uploadCV(file: File) {
    toast('Envoi du CV…');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/profile/cv', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Échec de l’envoi.');
    setCvName(data.cvName);
    router.refresh();
    toast('CV chargé ✓');
  }
  async function removeCV() {
    const res = await fetch('/api/profile/cv', { method: 'DELETE' });
    if (res.ok) {
      setCvName(null);
      router.refresh();
    }
  }

  const bioLen = bio.length;

  return (
    <div className="container profil-edit">
      <h1>Mon profil</h1>
      <p className="sub">
        C&apos;est ce que les clients verront. Plus il est complet, plus vous remontez dans les{' '}
        résultats de recherche.
      </p>

      {/* Bandeau « prêt à soumettre » bien visible, en haut */}
      {statutValidation !== 'APPROUVE' && statutValidation !== 'EN_ATTENTE' && tousRequisFaits && (
        <div className="profil-ready">
          <div className="profil-ready-txt">
            <strong>🎉 Votre profil est prêt à être soumis !</strong>
            <span>
              Titre et présentation remplis. Soumettez-le pour validation — vous apparaîtrez ensuite sur la
              marketplace. (Ajouter photo, services et portfolio vous fera remonter dans les résultats.)
            </span>
          </div>
          <button className="btn btn-light" disabled={submitting} onClick={submitValidation}>
            {submitting ? 'Envoi…' : 'Soumettre mon profil'}
          </button>
        </div>
      )}

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
        {statutValidation !== 'APPROUVE' && (
          <div className="profil-todo">
            <strong>Finalisez votre profil et vos services</strong> pour être publié et mis en avant
            sur la plateforme. Complétez toutes les étapes ci-dessous, puis demandez la validation.
          </div>
        )}
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
                {s} <button onClick={() => removeSkill(i)}><X size={13} /></button>
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
          {services.map((s) =>
            editId === s.id ? (
              <div className="service-item service-edit" key={s.id} style={{ display: 'block' }}>
                <div className="field">
                  <label>Titre du service</label>
                  <input type="text" value={eTitre} onChange={(e) => setETitre(e.target.value)} />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea rows={3} value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label>Prix à partir duquel tu acceptes de travailler (€)</label>
                    <input type="number" min={1} value={ePrix} onChange={(e) => setEPrix(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Délai (jours)</label>
                    <input type="number" min={1} value={eDelai} onChange={(e) => setEDelai(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-dark btn-sm" onClick={() => saveEdit(s.id)}>Enregistrer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>Annuler</button>
                </div>
              </div>
            ) : (
              <div className="service-item" key={s.id}>
                <div>
                  <div className="titre">{s.titre}</div>
                  <div className="desc">{s.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="prix">dès {euros(s.prix)}</div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button className="suppr" onClick={() => startEdit(s)}>Modifier</button>
                    <button className="suppr" onClick={() => removeService(s.id)}>Supprimer</button>
                  </div>
                </div>
              </div>
            )
          )}
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
            <label>Prix à partir duquel tu acceptes de travailler (€)</label>
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
          <FolderUp size={26} /> <strong>Cliquez pour ajouter des images</strong>
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
                  <X size={14} />
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
          <FileText size={26} /> <strong>Cliquez pour charger votre CV</strong>
          <br />
          PDF ou Word
        </div>
        {cvName && (
          <div className="cv-file">
            <FileText size={15} /> {cvName}
            <button onClick={removeCV} aria-label="Supprimer">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Vérification & demande de validation */}
      <div className="edit-card verif-card">
        <h2>Validation du profil</h2>
        <p className="hint" style={{ marginTop: -4, marginBottom: 14 }}>
          Complétez les {requis.length} critères requis ci-dessous, puis envoyez votre demande. Votre profil
          n’apparaît auprès des clients qu’une fois <strong>approuvé par notre équipe</strong>.
        </p>

        <div className="progress-bar" style={{ marginBottom: 14 }}>
          <div style={{ width: `${Math.round((faits / requis.length) * 100)}%` }} />
        </div>

        <div className="check-list">
          {checks.map((c) => (
            <div className="check-item" key={c.key}>
              <div className={`check-icon ${c.ok ? 'done' : 'todo'}`}>
                {c.ok ? <Check size={14} /> : '•'}
              </div>
              <div className="txt">
                <div className="titre">{c.titre}</div>
                <div className="desc">{c.desc}</div>
              </div>
              {!c.ok && (
                c.lien === '/parametres'
                  ? <Link href="/parametres" className="inline-ic">Compléter</Link>
                  : <span className="inline-ic" style={{ opacity: .6 }}>À faire ci-dessus</span>
              )}
            </div>
          ))}
        </div>

        {/* Bannière de statut + action */}
        {statutValidation === 'APPROUVE' ? (
          <div className="verif-banner ok" style={{ marginTop: 16 }}>
            <span className="big"><ShieldCheck size={22} /></span>
            <span>Profil <strong>approuvé</strong> ✓ — vous êtes visible par les clients dans « Trouver un freelance ».</span>
          </div>
        ) : statutValidation === 'EN_ATTENTE' ? (
          <div className="verif-banner pending" style={{ marginTop: 16 }}>
            <span className="big"><Clock size={22} /></span>
            <span>Demande <strong>envoyée</strong> — en attente de validation par notre équipe. Vous serez notifié.</span>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {statutValidation === 'REJETE' && (
              <div className="verif-banner" style={{ background: '#fdecea', color: '#c0392b', marginBottom: 12 }}>
                <span className="big"><X size={20} /></span>
                <span>
                  Demande précédente <strong>refusée</strong>{motifRejet ? ` : ${motifRejet}` : ''}. Corrigez puis renvoyez.
                </span>
              </div>
            )}
            {tousRequisFaits ? (
              <button className="btn btn-dark" disabled={submitting} onClick={submitValidation}>
                {submitting ? 'Envoi…' : 'Demander la validation de mon profil'}
              </button>
            ) : (
              <div className="verif-banner pending">
                <span className="big"><Clock size={22} /></span>
                <span>
                  <strong>{faits} / {requis.length}</strong> critères remplis — complétez tout pour pouvoir
                  soumettre votre demande.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="save-bar">
        <span>Pensez à enregistrer vos modifications de texte.</span>
        <button className="btn btn-light" onClick={saveAll}>
          Enregistrer mon profil
        </button>
      </div>
    </div>
  );
}
