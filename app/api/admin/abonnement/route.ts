import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';
import { ABONNEMENT_MOIS_MS } from '@/lib/abonnement';

const schema = z.object({
  userId: z.string().min(1),
  action: z.enum(['extend', 'cancel']),
});

// Admin : réactive (prolonge d'1 mois) ou annule l'abonnement d'un freelance.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  const { userId, action } = parsed.data;

  const sb = supabaseAdmin();

  if (action === 'cancel') {
    await sb.from('Profile').update({ abonnementValidUntil: null }).eq('userId', userId);
    await logAdminAction(session, 'Abonnement annulé', `utilisateur ${userId}`);
    return NextResponse.json({ ok: true });
  }

  // extend : +1 mois à partir de la date d'expiration actuelle (ou de maintenant si déjà expiré).
  const { data: prof } = await sb
    .from('Profile')
    .select('abonnementValidUntil')
    .eq('userId', userId)
    .maybeSingle();
  const current = (prof as { abonnementValidUntil: string | null } | null)?.abonnementValidUntil;
  const base = current && new Date(current).getTime() > Date.now() ? new Date(current).getTime() : Date.now();
  const next = new Date(base + ABONNEMENT_MOIS_MS).toISOString();

  await sb.from('Profile').update({ abonnementValidUntil: next }).eq('userId', userId);
  await logAdminAction(session, 'Abonnement prolongé (+1 mois)', `utilisateur ${userId}`);
  return NextResponse.json({ ok: true, validUntil: next });
}
