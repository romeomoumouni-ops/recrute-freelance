import { supabaseAdmin } from '@/lib/supabase';
import AdminModerationView, { type AdminFlagRow } from '@/components/admin/AdminModerationView';

export const dynamic = 'force-dynamic';

export default async function AdminModeration() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from('Message')
    .select('id, contenu, flagReason, createdAt, senderId, conversationId')
    .eq('flagged', true)
    .order('createdAt', { ascending: false })
    .limit(200);

  type M = { id: string; contenu: string; flagReason: string | null; createdAt: string; senderId: string; conversationId: string | null };
  const list = (rows as M[]) ?? [];
  const ids = [...new Set(list.map((m) => m.senderId))];
  const { data: users } = ids.length ? await sb.from('User').select('id, prenom, email, banni').in('id', ids) : { data: [] };
  const byId = new Map((users as { id: string; prenom: string; email: string; banni: boolean }[] ?? []).map((u) => [u.id, u]));

  const data: AdminFlagRow[] = list.map((m) => ({
    id: m.id, contenu: m.contenu, flagReason: m.flagReason, createdAt: m.createdAt,
    senderId: m.senderId,
    senderPrenom: byId.get(m.senderId)?.prenom ?? '—',
    senderEmail: byId.get(m.senderId)?.email ?? '',
    senderBanni: byId.get(m.senderId)?.banni ?? false,
    conversationId: m.conversationId,
  }));

  return (
    <>
      <h1 className="admin-h1">Modération</h1>
      <p className="admin-sub">
        Messages signalés comme tentative de contact hors plateforme. « Traité » retire le message de
        la file ; « Bannir » bloque l&apos;expéditeur.
      </p>
      <AdminModerationView flags={data} />
    </>
  );
}
