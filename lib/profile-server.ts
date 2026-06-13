import { supabaseAdmin } from './supabase';
import { isVerified } from './verification';
import { auth } from './auth';

// Recalcule et persiste estVerifie pour un freelance.
export async function recomputeVerification(userId: string): Promise<boolean> {
  const sb = supabaseAdmin();
  const { data: profile } = await sb
    .from('Profile')
    .select(
      'id, photoUrl, titre, bio, skills, cvUrl, user:User(telephoneMomo), services:Service(id), portfolio:PortfolioItem(id)'
    )
    .eq('userId', userId)
    .maybeSingle();
  if (!profile) return false;

  const user = profile.user as unknown as { telephoneMomo: string | null } | null;
  const verifie = isVerified({
    photoUrl: profile.photoUrl,
    titre: profile.titre,
    bio: profile.bio,
    skills: profile.skills,
    cvUrl: profile.cvUrl,
    portfolioCount: ((profile.portfolio as unknown[]) ?? []).length,
    servicesCount: ((profile.services as unknown[]) ?? []).length,
    telephoneMomo: user?.telephoneMomo,
  });

  await sb.from('Profile').update({ estVerifie: verifie }).eq('id', profile.id);
  return verifie;
}

// Garde-fou : exige une session freelance et renvoie son profileId.
export async function requireFreelanceProfile(): Promise<
  { ok: true; userId: string; profileId: string } | { ok: false; status: number; error: string }
> {
  const session = await auth();
  if (!session) return { ok: false, status: 401, error: 'Non authentifié.' };
  if (session.user.role !== 'FREELANCE') {
    return { ok: false, status: 403, error: 'Réservé aux comptes freelance.' };
  }
  const sb = supabaseAdmin();
  const { data: profile } = await sb
    .from('Profile')
    .select('id')
    .eq('userId', session.user.id)
    .maybeSingle();

  if (!profile) {
    const { data: created, error } = await sb
      .from('Profile')
      .insert({ userId: session.user.id, skills: '[]' })
      .select('id')
      .single();
    if (error) return { ok: false, status: 500, error: error.message };
    return { ok: true, userId: session.user.id, profileId: (created as { id: string }).id };
  }
  return { ok: true, userId: session.user.id, profileId: (profile as { id: string }).id };
}
