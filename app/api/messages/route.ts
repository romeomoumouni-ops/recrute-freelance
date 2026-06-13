import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { assertMember } from '@/lib/conversations';
import { messageSchema } from '@/lib/validations';
import { heureCourte } from '@/lib/utils';

interface MsgRow {
  id: string;
  senderId: string;
  contenu: string;
  type: string;
  meta: string | null;
  createdAt: string;
}

// Récupère les messages d'une conversation et marque comme lus ceux reçus.
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  if (!conversationId) return NextResponse.json({ error: 'Paramètre manquant.' }, { status: 400 });

  const conv = await assertMember(conversationId, session.user.id);
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });
  const sb = supabaseAdmin();

  await sb
    .from('Message')
    .update({ lu: true })
    .eq('conversationId', conversationId)
    .neq('senderId', session.user.id)
    .eq('lu', false);

  const { data: messages } = await sb
    .from('Message')
    .select('id, senderId, contenu, type, meta, createdAt')
    .eq('conversationId', conversationId)
    .order('createdAt', { ascending: true });

  return NextResponse.json({
    messages: ((messages as MsgRow[]) ?? []).map((m) => ({
      id: m.id,
      mine: m.senderId === session.user.id,
      contenu: m.contenu,
      type: m.type,
      meta: m.meta,
      heure: heureCourte(m.createdAt),
    })),
  });
}

// Envoie un message.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Message invalide.' },
      { status: 400 }
    );
  }
  const { conversationId, contenu } = parsed.data;

  const conv = await assertMember(conversationId, session.user.id);
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });

  const { data: msg, error } = await supabaseAdmin()
    .from('Message')
    .insert({ conversationId, senderId: session.user.id, contenu })
    .select('id, contenu, createdAt')
    .single();
  if (error || !msg) return NextResponse.json({ error: 'Envoi impossible.' }, { status: 500 });

  const m = msg as { id: string; contenu: string; createdAt: string };
  return NextResponse.json({
    message: { id: m.id, mine: true, contenu: m.contenu, type: 'TEXT', meta: null, heure: heureCourte(m.createdAt) },
  });
}
