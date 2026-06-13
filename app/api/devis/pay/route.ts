import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { buildTierCheckoutUrl, eurToFcfa } from '@/lib/chariow';
import { tierForAmount } from '@/lib/chariow-products';

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
  const tier = tierForAmount(montantEur);
  if (!tier) {
    return NextResponse.json({ error: 'Ce montant n’est plus disponible au paiement.' }, { status: 400 });
  }
  const montantFcfa = eurToFcfa(montantEur);

  // Email/prénom du payeur (pré-remplissage + clé de réconciliation).
  const { data: payer } = await sb
    .from('User')
    .select('email, prenom')
    .eq('id', session.user.id)
    .maybeSingle();
  const payerEmail = (payer?.email ?? session.user.email ?? '').toLowerCase();
  const payerPrenom = payer?.prenom ?? session.user.prenom ?? '';

  // Idempotence : on réutilise un paiement déjà "en attente" pour ce devis + ce payeur
  // (évite d'empiler des lignes si on clique plusieurs fois sur « Payer »).
  let pendingId: string | null = null;
  const { data: existing } = await sb
    .from('DevisPayment')
    .select('id')
    .eq('offerMessageId', offerMessageId)
    .eq('payerId', session.user.id)
    .eq('status', 'awaiting')
    .maybeSingle();
  if (existing) {
    pendingId = (existing as { id: string }).id;
  } else {
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
        productId: tier.productId,
        status: 'awaiting',
      })
      .select('id')
      .single();
    if (error || !pending) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    pendingId = (pending as { id: string }).id;
  }

  const checkoutUrl = buildTierCheckoutUrl({
    checkoutUrl: tier.checkoutUrl,
    email: payerEmail,
    prenom: payerPrenom,
    ref: pendingId,
    redirectUrl: `https://www.recrutefreelance.com/messages?c=${offer.conversationId}`,
  });

  // productId + storeDomain : pour afficher le widget Chariow (pop-up) côté client.
  return NextResponse.json({
    checkoutUrl,
    montantFcfa,
    productId: tier.productId,
    storeDomain: 'bajiuulm.mychariow.shop',
  });
}
