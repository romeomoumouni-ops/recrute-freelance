import 'server-only';
import { supabaseAdmin } from './supabase';
import type { Session } from './auth';

// Journalise une action admin (ne casse jamais l'action principale).
export async function logAdminAction(session: Session, action: string, cible?: string): Promise<void> {
  try {
    await supabaseAdmin().from('AdminLog').insert({
      adminId: session.user.id,
      adminPrenom: session.user.prenom,
      action,
      cible: cible ?? null,
    });
  } catch {
    /* ignore */
  }
}
