import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';
import { heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Row = { id: string; userId: string; fromAdmin: boolean; contenu: string; lu: boolean; createdAt: string };

// GET sans param : liste des fils. GET ?userId= : messages du fil (+ marque lus).
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const sb = supabaseAdmin();
  const userId = new URL(req.url).searchParams.get('userId');

  if (userId) {
    const { data } = await sb
      .from('SupportMessage')
      .select('id, fromAdmin, contenu, createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: true })
      .limit(200);
    await sb.from('SupportMessage').update({ lu: true }).eq('userId', userId).eq('fromAdmin', false).eq('lu', false);
    const rows = (data as { id: string; fromAdmin: boolean; contenu: string; createdAt: string }[]) ?? [];
    return NextResponse.json({
      messages: rows.map((m) => ({ id: m.id, fromAdmin: m.fromAdmin, contenu: m.contenu, heure: heureCourte(m.createdAt) })),
    });
  }

  // Liste des fils (agrégée côté serveur).
  const { data } = await sb
    .from('SupportMessage')
    .select('id, userId, fromAdmin, contenu, lu, createdAt')
    .order('createdAt', { ascending: false })
    .limit(1000);
  const rows = (data as Row[]) ?? [];
  const threads = new Map<string, { userId: string; lastMessage: string; lastAt: string; unread: number }>();
  for (const m of rows) {
    if (!threads.has(m.userId))
      threads.set(m.userId, { userId: m.userId, lastMessage: m.contenu, lastAt: m.createdAt, unread: 0 });
    if (!m.fromAdmin && !m.lu) threads.get(m.userId)!.unread++;
  }
  const ids = [...threads.keys()];
  const { data: users } = ids.length
    ? await sb.from('User').select('id, prenom, email, role').in('id', ids)
    : { data: [] };
  const byId = new Map((users as { id: string; prenom: string; email: string; role: string }[] ?? []).map((u) => [u.id, u]));

  const list = [...threads.values()]
    .map((t) => ({
      userId: t.userId,
      prenom: byId.get(t.userId)?.prenom ?? '—',
      email: byId.get(t.userId)?.email ?? '',
      role: byId.get(t.userId)?.role ?? '',
      lastMessage: t.lastMessage,
      heure: heureCourte(t.lastAt),
      unread: t.unread,
    }))
    .sort((a, b) => b.unread - a.unread || (a.heure < b.heure ? 1 : -1));

  return NextResponse.json({ threads: list });
}

const replySchema = z.object({ userId: z.string().min(1), contenu: z.string().trim().min(1).max(2000) });

// Réponse de l'admin à un utilisateur.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from('SupportMessage')
    .insert({ userId: parsed.data.userId, fromAdmin: true, contenu: parsed.data.contenu });
  if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });

  await logAdminAction(session, 'Réponse support', `utilisateur ${parsed.data.userId}`);
  return NextResponse.json({ ok: true });
}
