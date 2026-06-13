import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// Cible du lien de confirmation d'e-mail : échange le code contre une session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?toast=${encodeURIComponent('E-mail confirmé ✓ Bienvenue !')}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/connexion?toast=${encodeURIComponent('Lien de confirmation invalide ou expiré.')}`
  );
}
