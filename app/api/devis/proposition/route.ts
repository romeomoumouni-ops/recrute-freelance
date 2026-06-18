import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { assertMember } from '@/lib/conversations';
import { heureCourte } from '@/lib/utils';
import { blockIfFreelanceExpired } from '@/lib/abonnement';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  conversationId: z.string().min(1),
  amountEur: z.coerce.number().positive().max(100000),
  description: z.string().trim().min(1, 'Décrivez la prestation souhaitée.').max(500),
});

// CLIENT : envoie une PROPOSITION de prix (non payable). Le freelance l'accepte ou la refuse.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.role !== 'CLIENT') {
    return NextResponse.json(
      { error: 'Seuls les clients peuvent envoyer une proposition de prix.' },
      { status: 403 }
    );
  }
  if (session.user.banni) return NextResponse.json({ error: 'Compte suspendu.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }
  const { conversationId, amountEur, description } = parsed.data;

  const conv = await assertMember(conversationId, session.user.id);
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });

  const meta = JSON.stringify({ amountEur, description, status: 'pending' });
  const { data: msg, error } = await supabaseAdmin()
    .from('Message')
    .insert({
      conversationId,
      senderId: session.user.id,
      type: 'PROPOSITION',
      meta,
      contenu: `Proposition de prix : ${description}`,
    })
    .select('id, contenu, createdAt')
    .single();
  if (error || !msg) return NextResponse.json({ error: 'Envoi impossible.' }, { status: 500 });

  const m = msg as { id: string; contenu: string; createdAt: string };
  return NextResponse.json({
    message: {
      id: m.id,
      mine: true,
      contenu: m.contenu,
      type: 'PROPOSITION',
      meta,
      heure: heureCourte(m.createdAt),
    },
  });
}

const actSchema = z.object({
  messageId: z.string().min(1),
  action: z.enum(['accept', 'decline']),
});

// FREELANCE : accepte ou refuse une proposition reçue.
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.role !== 'FREELANCE') {
    return NextResponse.json({ error: 'Action réservée au freelance.' }, { status: 403 });
  }
  const blocked = await blockIfFreelanceExpired(session);
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const parsed = actSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  const { messageId, action } = parsed.data;

  const sb = supabaseAdmin();
  const { data: msg } = await sb
    .from('Message')
    .select('id, type, meta, senderId, conversationId')
    .eq('id', messageId)
    .maybeSingle();
  const row = msg as
    | { id: string; type: string; meta: string | null; senderId: string; conversationId: string }
    | null;
  if (!row || row.type !== 'PROPOSITION') {
    return NextResponse.json({ error: 'Proposition introuvable.' }, { status: 404 });
  }
  if (row.senderId === session.user.id) {
    return NextResponse.json({ error: 'Action impossible sur votre propre proposition.' }, { status: 403 });
  }
  const conv = await assertMember(row.conversationId, session.user.id);
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });

  let meta: Record<string, unknown> = {};
  try {
    meta = row.meta ? JSON.parse(row.meta) : {};
  } catch {
    meta = {};
  }
  meta.status = action === 'accept' ? 'accepted' : 'declined';
  await sb.from('Message').update({ meta: JSON.stringify(meta) }).eq('id', messageId);

  return NextResponse.json({ ok: true, status: meta.status });
}
