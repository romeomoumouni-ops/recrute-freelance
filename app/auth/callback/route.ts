import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase-server';

// Cible des liens d'e-mail (confirmation d'inscription + réinitialisation de mot de passe).
// Gère les deux formats possibles de Supabase : ?code=... (PKCE) ou ?token_hash=...&type=...
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') || '';
  const isReset = next.includes('reset') || type === 'recovery';

  const supabase = createServerSupabase();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(
      `${origin}/connexion?toast=${encodeURIComponent(
        'Lien invalide ou expiré. Réessayez ou demandez un nouveau lien.'
      )}`
    );
  }

  // Réinitialisation : on garde la session de récupération pour choisir le nouveau mot de passe.
  if (isReset) {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // Connexion OAuth (Google) : on GARDE la session et on redirige vers l'app.
  // (`next` est un chemin interne fourni par le bouton Google, ex. /dashboard.)
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Confirmation d'inscription : l'e-mail est validé → on déconnecte pour que la personne
  // se connecte explicitement avec ses identifiants, puis page de confirmation dédiée.
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/inscription-confirmee`);
}
