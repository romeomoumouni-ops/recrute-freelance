import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const schema = z.object({
  userId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  motif: z.string().trim().max(500).optional(),
});

// Admin : approuve ou refuse la demande de validation d'un freelance.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  const { userId, action, motif } = parsed.data;

  const sb = supabaseAdmin();

  if (action === 'approve') {
    // Approuvé → découvrable + badge vérifié. verifManuel fige la décision.
    await sb
      .from('Profile')
      .update({ statutValidation: 'APPROUVE', estVerifie: true, verifManuel: true, motifRejet: null })
      .eq('userId', userId);
    await logAdminAction(session, 'Freelance approuvé', `utilisateur ${userId}`);
    await createNotification({
      userId,
      type: 'VALIDATION',
      titre: 'Profil approuvé ✓',
      corps: 'Félicitations ! Votre profil est validé : il est désormais visible par les clients sur la plateforme.',
      lien: '/mon-profil',
    });
    return NextResponse.json({ ok: true });
  }

  // reject
  await sb
    .from('Profile')
    .update({ statutValidation: 'REJETE', estVerifie: false, verifManuel: true, motifRejet: motif || null })
    .eq('userId', userId);
  await logAdminAction(session, 'Demande de validation refusée', `utilisateur ${userId}${motif ? ` · ${motif}` : ''}`);
  await createNotification({
    userId,
    type: 'VALIDATION',
    titre: 'Demande de validation refusée',
    corps: motif
      ? `Votre demande n'a pas été retenue : ${motif}. Corrigez votre profil puis soumettez à nouveau.`
      : "Votre demande n'a pas été retenue. Vérifiez votre profil puis soumettez à nouveau.",
    lien: '/mon-profil',
  });
  return NextResponse.json({ ok: true });
}
