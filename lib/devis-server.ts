import 'server-only';
import { supabaseAdmin } from './supabase';

export interface LoadedOffer {
  offerMessageId: string;
  senderId: string;
  conversationId: string;
  clientId: string;
  freelanceId: string;
  meta: Record<string, unknown>;
  orderId: string | null;
  status: string;
}

// Charge un devis (message DEVIS_OFFER) + sa conversation + son meta JSON.
export async function loadOffer(offerMessageId: string): Promise<LoadedOffer | null> {
  const { data: offer } = await supabaseAdmin()
    .from('Message')
    .select('id, senderId, type, meta, conversationId, conversation:Conversation(clientId, freelanceId)')
    .eq('id', offerMessageId)
    .maybeSingle();
  if (!offer || offer.type !== 'DEVIS_OFFER') return null;
  const conv = offer.conversation as unknown as { clientId: string; freelanceId: string } | null;
  if (!conv) return null;
  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse((offer.meta as string) || '{}');
  } catch {
    /* ignore */
  }
  return {
    offerMessageId: offer.id as string,
    senderId: offer.senderId as string,
    conversationId: offer.conversationId as string,
    clientId: conv.clientId,
    freelanceId: conv.freelanceId,
    meta,
    orderId: (meta.orderId as string) ?? null,
    status: (meta.status as string) ?? 'pending',
  };
}

export async function setOfferMeta(offerMessageId: string, meta: Record<string, unknown>): Promise<void> {
  await supabaseAdmin().from('Message').update({ meta: JSON.stringify(meta) }).eq('id', offerMessageId);
}

export async function postSystemMessage(
  conversationId: string,
  senderId: string,
  contenu: string
): Promise<void> {
  await supabaseAdmin()
    .from('Message')
    .insert({ conversationId, senderId, type: 'TEXT', contenu });
}
