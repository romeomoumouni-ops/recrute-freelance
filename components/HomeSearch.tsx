'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearch() {
  const [q, setQ] = useState('');
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push('/recherche' + (term ? `?q=${encodeURIComponent(term)}` : ''));
  }

  return (
    <form className="search" onSubmit={submit}>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un service, un freelance ou une catégorie"
        aria-label="Rechercher"
      />
      <button type="submit">Rechercher</button>
    </form>
  );
}
