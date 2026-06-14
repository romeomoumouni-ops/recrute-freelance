import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';

const schema = z.object({ id: z.string().min(1), action: z.enum(['release', 'refund']) });

// Admin : libère une commande au freelance (release) ou la rembourse/annule (refund).
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  if (parsed.data.action === 'release') {
    const { data, error } = await supabaseAdmin().rpc('admin_release_order', { p_id: parsed.data.id });
    if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    if ((data as number) < 0) return NextResponse.json({ error: 'Commande non modifiable.' }, { status: 400 });
    await logAdminAction(session, 'Commande libérée au freelance', `commande ${parsed.data.id}`);
    return NextResponse.json({ ok: true, montant: data });
  }
  const { data, error } = await supabaseAdmin().rpc('admin_refund_order', { p_id: parsed.data.id });
  if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  if (data !== true) return NextResponse.json({ error: 'Commande non modifiable.' }, { status: 400 });
  await logAdminAction(session, 'Commande remboursée / annulée', `commande ${parsed.data.id}`);
  return NextResponse.json({ ok: true });
}
