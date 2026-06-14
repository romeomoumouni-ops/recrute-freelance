import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

const schema = z.object({
  userId: z.string().min(1),
  action: z.enum(['clearPhoto', 'clearBio', 'clearNote']),
});

// Admin : modération du profil d'un freelance (vider une photo/bio/note inappropriée).
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const patch =
    parsed.data.action === 'clearPhoto'
      ? { photoUrl: null }
      : parsed.data.action === 'clearBio'
        ? { bio: null }
        : { note: null };
  await supabaseAdmin().from('Profile').update(patch).eq('userId', parsed.data.userId);
  return NextResponse.json({ ok: true });
}
