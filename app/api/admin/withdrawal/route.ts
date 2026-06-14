import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';

const schema = z.object({ id: z.string().min(1), action: z.enum(['settle', 'reject']) });

// Admin : marque un retrait comme envoyé (settle) ou le rejette + rembourse (reject).
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const fn = parsed.data.action === 'settle' ? 'admin_settle_withdrawal' : 'admin_reject_withdrawal';
  const { data, error } = await supabaseAdmin().rpc(fn, { p_id: parsed.data.id });
  if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  if (data !== true) return NextResponse.json({ error: 'Retrait déjà traité.' }, { status: 400 });
  await logAdminAction(session, parsed.data.action === 'settle' ? 'Retrait envoyé' : 'Retrait rejeté (remboursé)', `retrait ${parsed.data.id}`);
  return NextResponse.json({ ok: true });
}
