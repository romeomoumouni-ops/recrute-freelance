import { auth, type Session } from './auth';

// Exige une session ADMIN. Renvoie la session, ou null si l'utilisateur n'est
// pas admin (les appelants redirigent / renvoient 404 — l'espace reste invisible).
export async function requireAdmin(): Promise<Session | null> {
  const session = await auth();
  if (!session || !session.user.admin) return null;
  return session;
}
