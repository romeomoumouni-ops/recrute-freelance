import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Suppression définitive du compte de l'utilisateur connecté (toutes ses données).
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  // Sécurité : un compte administrateur ne peut pas s'auto-supprimer ici.
  if (session.user.admin) {
    return NextResponse.json(
      { error: 'Un compte administrateur ne peut pas être supprimé depuis cet espace.' },
      { status: 403 }
    );
  }

  const uid = session.user.id;
  const sb = supabaseAdmin();

  // 1) Supprime toutes les données applicatives (ordre respectant les contraintes).
  const { error } = await sb.rpc('delete_user_account', { uid });
  if (error) {
    console.error('[account/delete] rpc', error.message);
    return NextResponse.json({ error: 'Suppression impossible. Réessayez.' }, { status: 500 });
  }

  // 2) Supprime le compte d'authentification (Supabase Auth).
  await sb.auth.admin.deleteUser(uid).catch((e) => console.error('[account/delete] auth', e));

  // 3) Termine la session côté cookies.
  try {
    const s = createServerSupabase();
    await s.auth.signOut();
  } catch {
    /* ignore */
  }

  return NextResponse.json({ ok: true });
}
