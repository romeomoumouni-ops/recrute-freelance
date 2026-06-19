'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import FreelanceCardLink from '@/components/FreelanceCardLink';
import { CATEGORIES_LIST, CATEGORIES } from '@/lib/constants';
import type { FreelanceCard } from '@/lib/freelancers';

export default function SearchClient({
  cards,
  paysList,
}: {
  cards: FreelanceCard[];
  paysList: string[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState(params.get('cat') ?? '');
  const [pays, setPays] = useState('');
  const [budget, setBudget] = useState('');
  const [tri, setTri] = useState('reco');

  // Synchronise q & cat dans l'URL (sans recharger).
  useEffect(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    if (cat) sp.set('cat', cat);
    const qs = sp.toString();
    router.replace(pathname + (qs ? `?${qs}` : ''), { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat]);

  const list = useMemo(() => {
    const term = q.toLowerCase().trim();
    let res = cards.filter((f) => {
      const texte = (
        f.nom +
        ' ' +
        f.titre +
        ' ' +
        f.skills.join(' ') +
        ' ' +
        (f.cat ? CATEGORIES[f.cat] ?? '' : '')
      ).toLowerCase();
      if (term && !texte.includes(term)) return false;
      if (cat && f.cat !== cat) return false;
      if (pays && f.pays !== pays) return false;
      if (budget && (f.tarif == null || f.tarif > Number(budget))) return false;
      return true;
    });
    if (tri === 'reco')
      res = [...res].sort((a, b) => b.completude - a.completude || b.note - a.note || b.avis - a.avis);
    if (tri === 'note') res = [...res].sort((a, b) => b.note - a.note);
    if (tri === 'prix-asc') res = [...res].sort((a, b) => (a.tarif ?? 1e9) - (b.tarif ?? 1e9));
    if (tri === 'prix-desc') res = [...res].sort((a, b) => (b.tarif ?? -1) - (a.tarif ?? -1));
    return res;
  }, [cards, q, cat, pays, budget, tri]);

  return (
    <>
      <div className="filters">
        <input
          type="text"
          placeholder="Rechercher par nom, compétence, métier…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Recherche"
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {CATEGORIES_LIST.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select value={pays} onChange={(e) => setPays(e.target.value)} aria-label="Pays">
          <option value="">Tous les pays</option>
          {paysList.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Budget">
          <option value="">Tous les budgets</option>
          <option value="300">Jusqu&apos;à 300 €</option>
          <option value="600">Jusqu&apos;à 600 €</option>
          <option value="1000">Jusqu&apos;à 1 000 €</option>
          <option value="3000">Jusqu&apos;à 3 000 €</option>
        </select>
        <select value={tri} onChange={(e) => setTri(e.target.value)} aria-label="Trier">
          <option value="reco">Recommandés</option>
          <option value="note">Mieux notés</option>
          <option value="prix-asc">Prix croissant</option>
          <option value="prix-desc">Prix décroissant</option>
        </select>
      </div>

      <div className="results-count">
        {list.length} freelance{list.length > 1 ? 's' : ''} disponible{list.length > 1 ? 's' : ''}
      </div>

      {list.length ? (
        <div className="freelance-grid">
          {list.map((f) => (
            <FreelanceCardLink key={f.id} f={f} />
          ))}
        </div>
      ) : (
        <div className="empty">Aucun freelance ne correspond à votre recherche.</div>
      )}
    </>
  );
}
