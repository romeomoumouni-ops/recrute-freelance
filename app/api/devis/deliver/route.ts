import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { loadOffer, setOfferMeta, postSystemMessage } from '@/lib/devis-server';
import { createNotification } from '@/lib/notifications';

const schema = z.object({ offerMessageId: z.string().min(1) });

// Le freelance marque la commande comme livrée (EN_COURS -> LIVREE).
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const offer = await loadOffer(parsed.data.offerMessageId);
  if (!offer || !offer.orderId) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
  if (offer.senderId !== session.user.id) {
    return NextResponse.json({ error: 'Seul le freelance peut livrer la commande.' }, { status: 403 });
  }

  // Passage EN_COURS -> LIVREE (garde atomique : propriétaire + statut).
  const { data: updated } = await supabaseAdmin()
    .from('Order')
    .update({ statut: 'LIVREE' })
    .eq('id', offer.orderId)
    .eq('freelanceId', session.user.id)
    .eq('statut', 'EN_COURS')
    .select('id');
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'Commande déjà livrée ou non modifiable.' }, { status: 400 });
  }

  offer.meta.status = 'delivered';
  await setOfferMeta(offer.offerMessageId, offer.meta);
  await postSystemMessage(
    offer.conversationId,
    session.user.id,
    '📦 Le freelance a livré la commande. Vous pouvez la valider ou demander une retouche.'
  );

  // Notifie le client que sa commande est livrée (à valider).
  const clientId = offer.clientId === offer.senderId ? offer.freelanceId : offer.clientId;
  const description = (offer.meta.description as string) || 'votre commande';
  await createNotification({
    userId: clientId,
    type: 'LIVRAISON',
    titre: '📦 Commande livrée',
    corps: `Le freelance a livré « ${description} ». Validez la commande ou demandez une retouche.`,
    lien: `/messages?c=${offer.conversationId}`,
  });

  return NextResponse.json({ ok: true });
}
