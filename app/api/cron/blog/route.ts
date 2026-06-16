import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateArticle, slugify } from '@/lib/blog-generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('x-cron-secret');
  const qs = new URL(req.url).searchParams.get('secret');
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return header === secret || qs === secret || bearer === secret;
}

// Publie chaque jour un nouvel article de blog SEO (appelé par pg_cron).
async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = supabaseAdmin();

  // Titres récents pour éviter les doublons.
  const { data: recent } = await sb
    .from('BlogPost')
    .select('title, slug')
    .order('createdAt', { ascending: false })
    .limit(80);
  const titles = ((recent as { title: string }[]) ?? []).map((r) => r.title);

  const article = await generateArticle(titles);
  if (!article) {
    return NextResponse.json({ skipped: true, reason: 'ANTHROPIC_API_KEY manquant ou génération indisponible.' });
  }

  // Slug unique
  let slug = slugify(article.title) || `article-${Date.now()}`;
  const { data: clash } = await sb.from('BlogPost').select('slug').eq('slug', slug).maybeSingle();
  if (clash) slug = `${slug}-${Math.floor((Date.now() / 1000) % 100000)}`;

  const { error } = await sb.from('BlogPost').insert({
    slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    blocks: article.blocks,
    metaDescription: article.metaDescription,
    readMins: article.readMins,
    published: true,
  });
  if (error) {
    return NextResponse.json({ error: 'Insertion impossible.', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, title: article.title });
}

export async function POST(req: Request) {
  return run(req);
}
export async function GET(req: Request) {
  return run(req);
}
