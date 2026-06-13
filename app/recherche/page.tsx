import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getFreelanceCards } from '@/lib/freelancers';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Trouver un freelance',
  description:
    'Des talents vérifiés en Afrique francophone, prêts à travailler avec vous. Filtrez par compétence, pays et budget.',
};

export const dynamic = 'force-dynamic';

export default async function RecherchePage() {
  const cards = await getFreelanceCards();
  const pays = Array.from(new Set(cards.map((c) => c.pays).filter(Boolean) as string[])).sort();

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Trouver un freelance</h1>
          <p style={{ fontSize: '.88rem', color: 'var(--gray-300)' }}>
            Des talents vérifiés en Afrique francophone, prêts à travailler avec vous.
          </p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 80 }}>
        <Suspense fallback={<div className="results-count">Chargement…</div>}>
          <SearchClient cards={cards} paysList={pays} />
        </Suspense>
      </div>
    </>
  );
}
