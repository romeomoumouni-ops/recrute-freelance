'use client';

import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import Avatar from './Avatar';
import { CATEGORIES } from '@/lib/constants';
import { euros } from '@/lib/utils';
import type { FreelanceCard } from '@/lib/freelancers';

export default function FreelanceCardLink({ f }: { f: FreelanceCard }) {
  const href = `/freelance/${f.id}`;
  return (
    <div className="fl-card">
      <Link href={href} className="fl-top fl-top-link">
        <Avatar nom={f.nom} photoUrl={f.photoUrl} />
        <div>
          <h3>{f.nom}</h3>
          <div className="role">{f.titre}</div>
        </div>
      </Link>

      <div className="fl-meta">
        {f.pays && (
          <span className="fl-pays">
            <MapPin size={13} /> {f.pays}
          </span>
        )}
        {f.cat && <span className="badge">{CATEGORIES[f.cat] ?? f.cat}</span>}
      </div>

      <div className="skills">
        {f.skills.slice(0, 4).map((s) => (
          <span className="badge" key={s}>
            {s}
          </span>
        ))}
      </div>

      {/* Aperçu portfolio glissable (avant de cliquer sur le profil) */}
      {f.portfolioPreview.length > 0 && (
        <div className="fl-portfolio" aria-label="Aperçu du portfolio">
          {f.portfolioPreview.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="Réalisation" loading="lazy" />
          ))}
        </div>
      )}

      <div className="fl-bottom">
        <span className="price">
          {f.tarif != null ? (
            <>
              <small>À partir de</small> {euros(f.tarif)}
              <small className="price-note">Prix à partir duquel ce freelance travaille</small>
            </>
          ) : (
            <small>Sur devis</small>
          )}
        </span>
        <span className="rating">
          {f.avis > 0 ? (
            <>
              <Star size={14} fill="currentColor" /> {f.note.toFixed(1)} <small>({f.avis})</small>
            </>
          ) : (
            <small style={{ color: 'var(--gray-500)' }}>Nouveau</small>
          )}
        </span>
      </div>

      <Link href={href} className="btn btn-dark btn-block">
        Voir le profil du freelance
      </Link>
    </div>
  );
}
