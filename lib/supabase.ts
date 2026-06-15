import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

// Client serveur (service_role) : contourne RLS. NE JAMAIS l'importer côté client.
// L'import 'server-only' fait échouer le build si ce fichier finit dans un bundle navigateur.
//
// Les variables d'env sont lues PARESSEUSEMENT (à la 1re utilisation), pas au chargement du
// module : ainsi le build (« collecting page data ») ne plante pas si elles ne sont pas
// encore définies ; seules les requêtes réelles échoueront en cas de config manquante.
let _admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant (variables d’environnement)');
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant (variables d’environnement)');
    }
    _admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' },
      // IMPORTANT : Next.js met en cache les `fetch` côté serveur (Data Cache), ce qui
      // figeait les lectures (un freelance approuvé n'apparaissait pas, données obsolètes).
      // On force `no-store` : toutes les lectures Supabase sont toujours fraîches.
      global: {
        fetch: ((input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' })) as typeof fetch,
      },
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
