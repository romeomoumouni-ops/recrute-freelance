import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import Avatar from './Avatar';
import { CATEGORIES } from '@/lib/constants';
import { euros } from '@/lib/utils';
import type { FreelanceCard } from '@/lib/freelancers';

export default function FreelanceCardLink({ f }: { f: FreelanceCard }) {
  return (
    <Link className="fl-card" href={`/freelance/${f.id}`}>
      <div className="fl-top">
        <Avatar nom={f.nom} photoUrl={f.photoUrl} />
        <div>
          <h3>{f.nom}</h3>
          <div className="role">{f.titre}</div>
        </div>
      </div>
      <div className="fl-meta">
        {f.pays && <span className="fl-pays"><MapPin size={13} /> {f.pays}</span>}
        {f.cat && <span className="badge">{CATEGORIES[f.cat] ?? f.cat}</span>}
      </div>
      <div className="skills">
        {f.skills.slice(0, 4).map((s) => (
          <span className="badge" key={s}>
            {s}
          </span>
        ))}
      </div>
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
    </Link>
  );
}
