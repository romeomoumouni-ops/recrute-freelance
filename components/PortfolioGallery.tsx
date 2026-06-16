'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Item {
  id: string;
  imageUrl: string;
}

export default function PortfolioGallery({ items }: { items: Item[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length)),
    [items.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % items.length)),
    [items.length]
  );

  // Navigation clavier + blocage du scroll quand la lightbox est ouverte.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, prev, next]);

  return (
    <>
      <div className="portfolio-grid">
        {items.map((img, i) => (
          <button
            type="button"
            className="portfolio-item portfolio-clickable"
            key={img.id}
            onClick={() => setIndex(i)}
            aria-label="Agrandir l'image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imageUrl} alt="Réalisation" />
          </button>
        ))}
      </div>

      {open && index !== null && (
        <div className="lightbox" onClick={close} role="dialog" aria-modal="true">
          <button className="lightbox-close" onClick={close} aria-label="Fermer">
            <X size={26} />
          </button>
          {items.length > 1 && (
            <button
              className="lightbox-nav left"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Image précédente"
            >
              <ChevronLeft size={30} />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="lightbox-img"
            src={items[index].imageUrl}
            alt="Réalisation"
            onClick={(e) => e.stopPropagation()}
          />
          {items.length > 1 && (
            <button
              className="lightbox-nav right"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Image suivante"
            >
              <ChevronRight size={30} />
            </button>
          )}
          {items.length > 1 && (
            <div className="lightbox-count">
              {index + 1} / {items.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
