import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { euros } from '@/lib/utils';
import { loadOffer, setOfferMeta, postSystemMessage } from '@/lib/devis-server';
import { createNotification } from '@/lib/notifications';

const schema = z.object({ offerMessageId: z.string().min(1) });

// Le client valide la commande -> libère les fonds séquestrés vers le solde du freelance.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.banni) return NextResponse.json({ error: 'Compte suspendu.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const offer = await loadOffer(parsed.data.offerMessageId);
  if (!offer || !offer.orderId) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });

  // validate_order vérifie lui-même que l'acteur est bien le client de la commande.
  const { data, error } = await supabaseAdmin().rpc('validate_order', {
    order_id: offer.orderId,
    actor_id: session.user.id,
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('forbidden'))
      return NextResponse.json({ error: 'Seul le client peut valider.' }, { status: 403 });
    if (msg.includes('bad_status'))
      return NextResponse.json({ error: 'Cette commande est déjà validée.' }, { status: 400 });
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }

  offer.meta.status = 'validated';
  await setOfferMeta(offer.offerMessageId, offer.meta);
  await postSystemMessage(
    offer.conversationId,
    session.user.id,
    `✅ Commande validée. ${euros(data as number)} ont été versés sur le solde du freelance.`
  );

  // Notifie le freelance que sa commande est validée et payée.
  await createNotification({
    userId: offer.senderId,
    type: 'VALIDATION',
    titre: '✅ Commande validée',
    corps: `${session.user.prenom} a validé la commande. ${euros(data as number)} ajoutés à votre solde disponible.`,
    lien: '/dashboard',
  });

  return NextResponse.json({ ok: true, montant: data as number });
}
