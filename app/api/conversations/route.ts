import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { conversationSchema } from '@/lib/validations';
import { getConversationsFor, findOrCreateConversation } from '@/lib/conversations';

// Liste des conversations de l'utilisateur (pour le polling de la messagerie).
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  const conversations = await getConversationsFor(session.user.id);
  return NextResponse.json({ conversations });
}

// Crée (ou retrouve) la conversation entre le client courant et un freelance.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = conversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  }
  const { freelanceId } = parsed.data;

  if (freelanceId === session.user.id) {
    return NextResponse.json({ error: 'Conversation invalide.' }, { status: 400 });
  }
  const sb = supabaseAdmin();

  const { data: freelance } = await sb
    .from('User')
    .select('id')
    .eq('id', freelanceId)
    .eq('role', 'FREELANCE')
    .maybeSingle();
  if (!freelance) return NextResponse.json({ error: 'Freelance introuvable.' }, { status: 404 });

  const conversationId = await findOrCreateConversation(session.user.id, freelanceId);
  if (!conversationId) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });

  return NextResponse.json({ conversationId });
}
