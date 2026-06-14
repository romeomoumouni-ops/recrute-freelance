import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';

const schema = z.object({ id: z.string().min(1), action: z.enum(['delete']) });

// Admin : supprime un avis abusif.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  await supabaseAdmin().from('Review').delete().eq('id', parsed.data.id);
  await logAdminAction(session, 'Avis supprimé', `avis ${parsed.data.id}`);
  return NextResponse.json({ ok: true });
}
