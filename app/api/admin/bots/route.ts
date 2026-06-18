import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';

const schema = z.object({ action: z.literal('cleanup') });

const uniq = <T,>(a: T[]) => [...new Set(a)];

// Admin : supprime TOUS les comptes de test (bots) et tout ce qui s'y rattache,
// puis coupe le moteur de test. À utiliser avant le passage en public.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!schema.safeParse(body).success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const sb = supabaseAdmin();

  // 1) Coupe le moteur tout de suite.
  await sb.from('Setting').upsert({ key: 'bots_test_actifs', value: 'off' }, { onConflict: 'key' });

  // 2) Identifie les bots.
  const { data: botRows } = await sb.from('User').select('id').eq('isTestBot', true);
  const botIds = ((botRows as { id: string }[]) ?? []).map((b) => b.id);

  if (botIds.length === 0) {
    await logAdminAction(session, 'Nettoyage bots', 'aucun bot');
    return NextResponse.json({ ok: true, bots: 0, conversations: 0 });
  }

  // 3) Conversations impliquant un bot (côté client ou freelance).
  const [{ data: c1 }, { data: c2 }] = await Promise.all([
    sb.from('Conversation').select('id').in('clientId', botIds),
    sb.from('Conversation').select('id').in('freelanceId', botIds),
  ]);
  const convIds = uniq([
    ...((c1 as { id: string }[]) ?? []).map((c) => c.id),
    ...((c2 as { id: string }[]) ?? []).map((c) => c.id),
  ]);

  // 4) Supprime dans l'ordre : scénarios, messages, conversations, puis les bots.
  await sb.from('BotScenario').delete().neq('id', '');
  if (convIds.length) {
    await sb.from('Message').delete().in('conversationId', convIds);
    await sb.from('Conversation').delete().in('id', convIds);
  }
  // Filet de sécurité : messages éventuellement envoyés par un bot ailleurs.
  await sb.from('Message').delete().in('senderId', botIds);
  await sb.from('User').delete().eq('isTestBot', true);

  await logAdminAction(session, 'Nettoyage bots', `${botIds.length} bots, ${convIds.length} conversations supprimés`);
  return NextResponse.json({ ok: true, bots: botIds.length, conversations: convIds.length });
}
