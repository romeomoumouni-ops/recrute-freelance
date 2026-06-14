import { createServerSupabase } from './supabase-server';
import { supabaseAdmin } from './supabase';
import type { Role } from './constants';

export interface Session {
  user: { id: string; email: string; role: Role; prenom: string; admin: boolean; banni: boolean };
}

// Renvoie l'utilisateur connecté (via Supabase Auth) ou null.
// Le rôle/prénom sont lus dans public.User (source de vérité, non modifiable par
// l'utilisateur), pas dans les métadonnées du token.
export async function auth(): Promise<Session | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabaseAdmin()
    .from('User')
    .select('role, prenom, admin, banni')
    .eq('id', user.id)
    .maybeSingle();

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      role: ((row?.role as Role) ?? 'CLIENT') as Role,
      prenom: row?.prenom ?? user.email?.split('@')[0] ?? '',
      admin: row?.admin === true,
      banni: row?.banni === true,
    },
  };
}
