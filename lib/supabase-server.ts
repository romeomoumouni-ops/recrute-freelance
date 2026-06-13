import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Client Supabase lié aux cookies de la requête (clé anon) — sert UNIQUEMENT à
// connaître l'utilisateur connecté (Supabase Auth). L'accès aux données passe par
// supabaseAdmin (service_role) côté serveur.
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : on ignore, le middleware rafraîchit.
          }
        },
      },
    }
  );
}
