'use client';

import { useState } from 'react';

const LIMITE = 140;

// Affiche une portion de la description avec un « Voir plus » (déplié au clic).
export default function ServiceDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;

  if (text.length <= LIMITE) return <div className="desc">{text}</div>;

  return (
    <div className="desc">
      {open ? text : text.slice(0, LIMITE).trimEnd() + '… '}
      <button type="button" className="voir-plus" onClick={() => setOpen((o) => !o)}>
        {open ? 'Voir moins' : 'Voir plus'}
      </button>
    </div>
  );
}
