import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { loadOffer, setOfferMeta, postSystemMessage } from '@/lib/devis-server';

const schema = z.object({
  offerMessageId: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

// Le client demande une retouche (LIVREE -> EN_COURS). Les fonds restent séquestrés.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.banni) return NextResponse.json({ error: 'Compte suspendu.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const offer = await loadOffer(parsed.data.offerMessageId);
  if (!offer || !offer.orderId) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });

  // Retour LIVREE -> EN_COURS (garde atomique : c'est bien le client, commande livrée).
  const { data: updated } = await supabaseAdmin()
    .from('Order')
    .update({ statut: 'EN_COURS' })
    .eq('id', offer.orderId)
    .eq('clientId', session.user.id)
    .eq('statut', 'LIVREE')
    .select('id');
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: 'Retouche impossible (commande non livrée ou déjà validée).' },
      { status: 400 }
    );
  }

  offer.meta.status = 'paid';
  await setOfferMeta(offer.offerMessageId, offer.meta);
  const reason = parsed.data.reason?.trim();
  await postSystemMessage(
    offer.conversationId,
    session.user.id,
    `🔄 Retouche demandée par le client.${reason ? ` « ${reason} »` : ''}`
  );

  return NextResponse.json({ ok: true });
}
