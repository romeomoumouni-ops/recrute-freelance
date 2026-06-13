import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

// Client serveur (service_role) : contourne RLS. NE JAMAIS l'importer côté client.
// L'import 'server-only' fait échouer le build si ce fichier finit dans un bundle navigateur.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant dans .env');
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant dans .env');

let _admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' },
      // Node < 22 n'a pas de WebSocket global ; on fournit `ws` (realtime non utilisé).
      realtime: { transport: ws as unknown as undefined },
    });
  }
  return _admin;
}

// Petit helper : lève l'erreur Supabase si présente, sinon renvoie data.
export function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
