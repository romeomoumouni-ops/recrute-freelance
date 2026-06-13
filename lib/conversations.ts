import { supabaseAdmin } from './supabase';

export interface ConversationSummary {
  id: string;
  avecId: string;
  avecNom: string;
  avecPhoto: string | null;
  apercu: string;
  heure: string;
  createdAt: string;
  unread: number;
}

function heureLabel(d: Date): string {
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

interface RpcRow {
  id: string;
  avecId: string;
  avecNom: string;
  avecPhoto: string | null;
  apercu: string | null;
  lastAt: string | null;
  unread: number | string;
}

export async function getConversationsFor(userId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabaseAdmin().rpc('get_conversations', { uid: userId });
  if (error) throw new Error(error.message);
  return ((data as RpcRow[]) ?? []).map((c) => ({
    id: c.id,
    avecId: c.avecId,
    avecNom: c.avecNom,
    avecPhoto: c.avecPhoto,
    apercu: c.apercu ?? 'Nouvelle conversation',
    heure: c.lastAt ? heureLabel(new Date(c.lastAt)) : '',
    createdAt: c.lastAt ?? new Date(0).toISOString(),
    unread: Number(c.unread) || 0,
  }));
}

// Retrouve la conversation entre deux utilisateurs (dans n'importe quel sens),
// ou la crée. `initiatorId` devient le côté "clientId", `targetId` le "freelanceId".
export async function findOrCreateConversation(
  initiatorId: string,
  targetId: string
): Promise<string | null> {
  const sb = supabaseAdmin();
  const { data: existing } = await sb
    .from('Conversation')
    .select('id')
    .or(
      `and(clientId.eq.${initiatorId},freelanceId.eq.${targetId}),and(clientId.eq.${targetId},freelanceId.eq.${initiatorId})`
    )
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data: created, error } = await sb
    .from('Conversation')
    .insert({ clientId: initiatorId, freelanceId: targetId })
    .select('id')
    .single();
  if (error || !created) return null;
  return (created as { id: string }).id;
}

// Vérifie que l'utilisateur fait partie de la conversation.
export async function assertMember(conversationId: string, userId: string) {
  const { data: conv } = await supabaseAdmin()
    .from('Conversation')
    .select('id, clientId, freelanceId')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conv) return null;
  if (conv.clientId !== userId && conv.freelanceId !== userId) return null;
  return conv as { id: string; clientId: string; freelanceId: string };
}
