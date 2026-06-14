import 'server-only';
import { supabaseAdmin } from './supabase';

export interface AdminConvSummary {
  id: string;
  withId: string;
  withName: string;
  withEmail: string;
  lastContenu: string;
  lastAt: string | null;
  total: number;
  flaggedCount: number;
}

export interface AdminThreadMessage {
  id: string;
  senderId: string;
  senderName: string;
  contenu: string;
  type: string;
  meta: string | null;
  createdAt: string;
  flagged: boolean;
  flagReason: string | null;
}

export interface AdminThread {
  id: string;
  client: { id: string; prenom: string; email: string } | null;
  freelance: { id: string; prenom: string; email: string } | null;
  messages: AdminThreadMessage[];
}

const uniq = <T,>(a: T[]) => [...new Set(a)];

// Toutes les conversations impliquant un utilisateur (comme client OU freelance).
export async function getConversationsForUser(userId: string): Promise<AdminConvSummary[]> {
  const sb = supabaseAdmin();
  const { data: convs } = await sb
    .from('Conversation')
    .select('id, clientId, freelanceId, createdAt')
    .or(`clientId.eq.${userId},freelanceId.eq.${userId}`)
    .order('createdAt', { ascending: false })
    .limit(60);

  type C = { id: string; clientId: string; freelanceId: string; createdAt: string };
  const list = (convs as C[]) ?? [];
  if (list.length === 0) return [];

  const otherIds = uniq(list.map((c) => (c.clientId === userId ? c.freelanceId : c.clientId)));
  const { data: users } = await sb.from('User').select('id, prenom, email').in('id', otherIds);
  const byId = new Map(
    ((users as { id: string; prenom: string; email: string }[]) ?? []).map((u) => [u.id, u])
  );

  const convIds = list.map((c) => c.id);
  const { data: msgs } = await sb
    .from('Message')
    .select('id, conversationId, contenu, createdAt, flagged')
    .in('conversationId', convIds)
    .order('createdAt', { ascending: false })
    .limit(3000);

  type M = { id: string; conversationId: string; contenu: string; createdAt: string; flagged: boolean };
  const last = new Map<string, M>();
  const total = new Map<string, number>();
  const flagged = new Map<string, number>();
  for (const m of (msgs as M[]) ?? []) {
    if (!last.has(m.conversationId)) last.set(m.conversationId, m); // desc → premier vu = dernier message
    total.set(m.conversationId, (total.get(m.conversationId) ?? 0) + 1);
    if (m.flagged) flagged.set(m.conversationId, (flagged.get(m.conversationId) ?? 0) + 1);
  }

  return list.map((c) => {
    const otherId = c.clientId === userId ? c.freelanceId : c.clientId;
    const other = byId.get(otherId);
    const lm = last.get(c.id);
    return {
      id: c.id,
      withId: otherId,
      withName: other?.prenom ?? '—',
      withEmail: other?.email ?? '',
      lastContenu: lm?.contenu ?? 'Aucun message',
      lastAt: lm?.createdAt ?? null,
      total: total.get(c.id) ?? 0,
      flaggedCount: flagged.get(c.id) ?? 0,
    };
  });
}

// Le fil complet d'une conversation (lecture seule admin).
export async function getThread(conversationId: string): Promise<AdminThread | null> {
  const sb = supabaseAdmin();
  const { data: conv } = await sb
    .from('Conversation')
    .select('id, clientId, freelanceId')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conv) return null;
  const c = conv as { id: string; clientId: string; freelanceId: string };

  const ids = uniq([c.clientId, c.freelanceId]);
  const { data: users } = await sb.from('User').select('id, prenom, email').in('id', ids);
  const byId = new Map(
    ((users as { id: string; prenom: string; email: string }[]) ?? []).map((u) => [u.id, u])
  );

  const { data: msgs } = await sb
    .from('Message')
    .select('id, senderId, contenu, type, meta, createdAt, flagged, flagReason')
    .eq('conversationId', conversationId)
    .order('createdAt', { ascending: true });

  type M = {
    id: string; senderId: string; contenu: string; type: string; meta: string | null;
    createdAt: string; flagged: boolean; flagReason: string | null;
  };

  const messages: AdminThreadMessage[] = ((msgs as M[]) ?? []).map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: byId.get(m.senderId)?.prenom ?? '—',
    contenu: m.contenu,
    type: m.type,
    meta: m.meta,
    createdAt: m.createdAt,
    flagged: m.flagged,
    flagReason: m.flagReason,
  }));

  return {
    id: c.id,
    client: byId.get(c.clientId) ?? null,
    freelance: byId.get(c.freelanceId) ?? null,
    messages,
  };
}
