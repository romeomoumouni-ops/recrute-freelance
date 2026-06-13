import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { assertMember } from '@/lib/conversations';
import { CHARIOW_MIN_EUR } from '@/lib/chariow';
import { heureCourte } from '@/lib/utils';

const offerSchema = z.object({
  conversationId: z.string().min(1),
  amountEur: z.coerce.number().positive(),
  description: z.string().trim().min(1, 'Décrivez la prestation.').max(500),
});

// Le freelance (ou tout participant) envoie un DEVIS chiffré, payable par carte.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }
  const { conversationId, amountEur, description } = parsed.data;

  if (amountEur < CHARIOW_MIN_EUR) {
    return NextResponse.json(
      { error: `Le montant minimum est de ${CHARIOW_MIN_EUR} €.` },
      { status: 400 }
    );
  }

  const conv = await assertMember(conversationId, session.user.id);
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });

  const meta = JSON.stringify({ amountEur, description, status: 'pending' });
  const { data: msg, error } = await supabaseAdmin()
    .from('Message')
    .insert({
      conversationId,
      senderId: session.user.id,
      type: 'DEVIS_OFFER',
      meta,
      contenu: `Devis : ${description}`,
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
      type: 'DEVIS_OFFER',
      meta,
      heure: heureCourte(m.createdAt),
    },
  });
}
