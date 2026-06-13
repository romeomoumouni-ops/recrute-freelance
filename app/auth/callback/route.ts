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
  const next = searchParams.get('next') || '/dashboard';

  const supabase = createServerSupabase();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (ok) {
    const msg = next.includes('reset')
      ? 'E-mail vérifié ✓ Choisissez un nouveau mot de passe.'
      : 'E-mail confirmé ✓ Bienvenue !';
    return NextResponse.redirect(`${origin}${next}?toast=${encodeURIComponent(msg)}`);
  }

  return NextResponse.redirect(
    `${origin}/connexion?toast=${encodeURIComponent(
      'Lien invalide ou expiré. Réessayez ou demandez un nouveau lien.'
    )}`
  );
}
