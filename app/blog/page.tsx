import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { listArticles } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Conseils gratuits pour freelances : tarification, devis, négociation, portfolio, relation client et qualité de livraison.',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const articles = await listArticles();

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Blog</h1>
          <p style={{ fontSize: '.9rem', color: 'var(--gray-300)' }}>
            Des conseils gratuits pour mieux travailler, mieux vendre et mieux gagner en freelance.
          </p>
        </div>
      </div>

      <div className="container blog-list">
        {articles.map((a) => (
          <Link key={a.slug} href={`/blog/${a.slug}`} className="blog-card">
            <span className="blog-cat">{a.category}</span>
            <h2>{a.title}</h2>
            <p>{a.excerpt}</p>
            <div className="blog-meta">
              <span><Clock size={13} /> {a.readMins} min de lecture</span>
              <span className="blog-read">Lire l&apos;article <ArrowRight size={14} /></span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
