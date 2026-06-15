import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-log';

const schema = z.object({ id: z.string().min(1), action: z.enum(['ban', 'unban', 'verify', 'unverify']) });

// Admin : bannir / débannir un utilisateur, vérifier / dévérifier un freelance.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  const { id, action } = parsed.data;

  // Garde-fou : un admin ne peut pas se bannir lui-même.
  if (id === session.user.id && (action === 'ban' || action === 'unban')) {
    return NextResponse.json({ error: 'Action impossible sur votre propre compte.' }, { status: 400 });
  }
  const sb = supabaseAdmin();

  if (action === 'ban' || action === 'unban') {
    await sb.from('User').update({ banni: action === 'ban' }).eq('id', id);
  } else {
    // verifManuel : fige la décision pour que le recalcul automatique ne l'écrase pas.
    // On aligne aussi le statut de validation (= découvrabilité du freelance).
    await sb
      .from('Profile')
      .update({
        estVerifie: action === 'verify',
        verifManuel: true,
        statutValidation: action === 'verify' ? 'APPROUVE' : 'NON_SOUMIS',
      })
      .eq('userId', id);
  }
  const labels: Record<string, string> = { ban: 'Utilisateur banni', unban: 'Utilisateur débanni', verify: 'Freelance vérifié', unverify: 'Badge vérifié retiré' };
  await logAdminAction(session, labels[action], `utilisateur ${id}`);
  return NextResponse.json({ ok: true });
}
