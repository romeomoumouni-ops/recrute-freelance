import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';

const schema = z.object({
  commission_rate: z.coerce.number().min(0).max(0.9),
  banner_messagerie: z.string().trim().max(500),
  abonnement_url: z.string().trim().max(500).optional().default(''),
  bots_test_actifs: z.enum(['on', 'off']).optional().default('off'),
});

// Admin : enregistre les réglages éditables sans code.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const rows = [
    { key: 'commission_rate', value: String(parsed.data.commission_rate) },
    { key: 'banner_messagerie', value: parsed.data.banner_messagerie },
    { key: 'abonnement_url', value: parsed.data.abonnement_url },
    { key: 'bots_test_actifs', value: parsed.data.bots_test_actifs },
  ];
  await supabaseAdmin().from('Setting').upsert(rows, { onConflict: 'key' });
  await logAdminAction(session, 'Réglages modifiés', `commission ${Math.round(parsed.data.commission_rate * 100)}%`);
  return NextResponse.json({ ok: true });
}
