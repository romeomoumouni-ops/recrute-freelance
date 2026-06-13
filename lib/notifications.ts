import 'server-only';
import { supabaseAdmin } from './supabase';

export type NotifType = 'PAIEMENT' | 'VALIDATION' | 'LIVRAISON' | 'AVIS';

// Crée une notification pour un utilisateur. Ne casse jamais le flux principal
// (les erreurs sont avalées : une notif ratée ne doit pas faire échouer un paiement).
export async function createNotification(opts: {
  userId: string;
  type: NotifType;
  titre: string;
  corps?: string;
  lien?: string;
}): Promise<void> {
  try {
    await supabaseAdmin().from('Notification').insert({
      userId: opts.userId,
      type: opts.type,
      titre: opts.titre,
      corps: opts.corps ?? null,
      lien: opts.lien ?? null,
    });
  } catch {
    /* ignore */
  }
}
