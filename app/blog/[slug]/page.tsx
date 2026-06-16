import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { getArticle, listArticles } from '@/lib/blog';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle(params.slug);
  if (!a) return { title: 'Article introuvable' };
  return { title: a.title, description: a.excerpt };
}

export default async function ArticlePage({ params }: Props) {
  const a = await getArticle(params.slug);
  if (!a) notFound();

  const others = (await listArticles()).filter((x) => x.slug !== a.slug).slice(0, 3);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="blog-cat light">{a.category}</span>
          <h1>{a.title}</h1>
        </div>
      </div>

      <div className="container legal blog-article">
        <Link href="/blog" className="blog-back"><ArrowLeft size={15} /> Tous les articles</Link>
        <p className="legal-meta"><Clock size={13} /> {a.readMins} min de lecture</p>

        {a.blocks.map((b, i) => (
          <div key={i}>
            {b.h && <h2>{b.h}</h2>}
            {b.p && <p>{b.p}</p>}
            {b.list && (
              <ul>
                {b.list.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div className="blog-cta">
          <p>Prêt à décrocher des missions d&apos;entreprises européennes ?</p>
          <Link href="/inscription?role=freelance" className="btn btn-dark">Créer mon profil freelance</Link>
        </div>

        <h2 style={{ marginTop: 40 }}>À lire aussi</h2>
        <div className="blog-more">
          {others.map((o) => (
            <Link key={o.slug} href={`/blog/${o.slug}`} className="blog-more-link">
              <span className="blog-cat">{o.category}</span>
              <strong>{o.title}</strong>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
