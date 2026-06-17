import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Aiguillage après connexion : le freelance va sur son profil, le client sur son tableau de bord.
export default async function Bienvenue() {
  const session = await auth();
  if (!session) redirect('/connexion');
  redirect(session.user.role === 'FREELANCE' ? '/mon-profil' : '/dashboard');
}
