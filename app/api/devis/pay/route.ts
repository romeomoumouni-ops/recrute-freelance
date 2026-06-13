import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { buildChariowCheckoutUrl, eurToFcfa } from '@/lib/chariow';

const paySchema = z.object({ offerMessageId: z.string().min(1) });

// Le destinataire d'un devis lance le paiement par carte (Chariow).
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = paySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  const { offerMessageId } = parsed.data;
  const sb = supabaseAdmin();

  // Charge le devis + sa conversation.
  const { data: offer } = await sb
    .from('Message')
    .select('id, senderId, type, meta, conversationId, conversation:Conversation(clientId, freelanceId)')
    .eq('id', offerMessageId)
    .maybeSingle();
  if (!offer || offer.type !== 'DEVIS_OFFER') {
    return NextResponse.json({ error: 'Devis introuvable.' }, { status: 404 });
  }

  const conv = offer.conversation as unknown as { clientId: string; freelanceId: string } | null;
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });

  // Le payeur doit être membre ET ne pas être l'émetteur du devis.
  const isMember = conv.clientId === session.user.id || conv.freelanceId === session.user.id;
  if (!isMember) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  if (offer.senderId === session.user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas payer votre propre devis.' }, { status: 400 });
  }

  let meta: { amountEur: number; description: string; status: string };
  try {
    meta = JSON.parse(offer.meta as string);
  } catch {
    return NextResponse.json({ error: 'Devis invalide.' }, { status: 400 });
  }
  if (meta.status === 'paid') {
    return NextResponse.json({ error: 'Ce devis est déjà payé.' }, { status: 400 });
  }

  const montantEur = meta.amountEur;
  const montantFcfa = eurToFcfa(montantEur);

  // Email/prénom du payeur (pré-remplissage + clé de réconciliation).
  const { data: payer } = await sb
    .from('User')
    .select('email, prenom')
    .eq('id', session.user.id)
    .maybeSingle();
  const payerEmail = (payer?.email ?? session.user.email ?? '').toLowerCase();
  const payerPrenom = payer?.prenom ?? session.user.prenom ?? '';

  const { data: pending, error } = await sb
    .from('DevisPayment')
    .insert({
      offerMessageId,
      conversationId: offer.conversationId,
      freelanceId: offer.senderId,
      payerId: session.user.id,
      payerEmail,
      montantEur,
      montantFcfa,
      status: 'awaiting',
    })
    .select('id')
    .single();
  if (error || !pending) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });

  const checkoutUrl = buildChariowCheckoutUrl({
    email: payerEmail,
    prenom: payerPrenom,
    montantFcfa,
    ref: (pending as { id: string }).id,
  });

  return NextResponse.json({ checkoutUrl, montantFcfa });
}
