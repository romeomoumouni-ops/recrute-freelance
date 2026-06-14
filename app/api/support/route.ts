import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Fil de support de l'utilisateur connecté (+ marque comme lus les messages de l'admin).
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ messages: [], unread: 0 });

  const sb = supabaseAdmin();
  const { data } = await sb
    .from('SupportMessage')
    .select('id, fromAdmin, contenu, lu, createdAt')
    .eq('userId', session.user.id)
    .order('createdAt', { ascending: true })
    .limit(100);

  type Row = { id: string; fromAdmin: boolean; contenu: string; lu: boolean; createdAt: string };
  const rows = (data as Row[]) ?? [];

  // Marque comme lus les messages reçus de l'admin.
  await sb
    .from('SupportMessage')
    .update({ lu: true })
    .eq('userId', session.user.id)
    .eq('fromAdmin', true)
    .eq('lu', false);

  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      mine: !m.fromAdmin,
      contenu: m.contenu,
      heure: heureCourte(m.createdAt),
    })),
  });
}

const sendSchema = z.object({ contenu: z.string().trim().min(1).max(2000) });

// L'utilisateur envoie un message au support.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Message vide.' }, { status: 400 });

  const { data: msg, error } = await supabaseAdmin()
    .from('SupportMessage')
    .insert({ userId: session.user.id, fromAdmin: false, contenu: parsed.data.contenu })
    .select('id, contenu, createdAt')
    .single();
  if (error || !msg) return NextResponse.json({ error: 'Envoi impossible.' }, { status: 500 });

  const m = msg as { id: string; contenu: string; createdAt: string };
  return NextResponse.json({ message: { id: m.id, mine: true, contenu: m.contenu, heure: heureCourte(m.createdAt) } });
}
