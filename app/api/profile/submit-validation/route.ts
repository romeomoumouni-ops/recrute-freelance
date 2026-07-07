import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isVerified } from '@/lib/verification';
import { blockIfFreelanceExpired } from '@/lib/abonnement';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// Le freelance soumet sa demande de validation. Exige TOUS les critères remplis.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.role !== 'FREELANCE')
    return NextResponse.json({ error: 'Réservé aux freelances.' }, { status: 403 });
  if (session.user.banni) return NextResponse.json({ error: 'Compte suspendu.' }, { status: 403 });
  const blocked = await blockIfFreelanceExpired(session);
  if (blocked) return blocked;

  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from('User')
    .select(
      'telephoneMomo, profile:Profile(id, statutValidation, photoUrl, titre, bio, skills, cvUrl, services:Service(id), portfolio:PortfolioItem(id))'
    )
    .eq('id', session.user.id)
    .maybeSingle();

  // PostgREST peut renvoyer la relation imbriquée comme tableau OU objet : on normalise.
  const profileRaw = user?.profile as unknown;
  const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as {
    id: string;
    statutValidation: string;
    photoUrl: string | null;
    titre: string | null;
    bio: string | null;
    skills: string | null;
    cvUrl: string | null;
    services: unknown[];
    portfolio: unknown[];
  } | null;

  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });

  if (profile.statutValidation === 'APPROUVE') {
    return NextResponse.json({ ok: true, statut: 'APPROUVE' });
  }
  if (profile.statutValidation === 'EN_ATTENTE') {
    return NextResponse.json({ ok: true, statut: 'EN_ATTENTE' });
  }

  const complet = isVerified({
    photoUrl: profile.photoUrl,
    titre: profile.titre,
    bio: profile.bio,
    skills: profile.skills,
    cvUrl: profile.cvUrl,
    portfolioCount: (profile.portfolio ?? []).length,
    servicesCount: (profile.services ?? []).length,
    telephoneMomo: user?.telephoneMomo,
  });

  if (!complet) {
    return NextResponse.json(
      { error: 'Complétez d’abord toutes les étapes de vérification (dont le numéro Mobile Money).' },
      { status: 400 }
    );
  }

  // Auto-approbation : le profil remplit tous les critères → validé immédiatement.
  // dateValidationAuto marque l'auto-approbation (pour le décompte admin).
  // verifManuel=true fige la décision (recomputeVerification ne l'écrase pas).
  const now = new Date().toISOString();
  await sb
    .from('Profile')
    .update({
      statutValidation: 'APPROUVE',
      estVerifie: true,
      verifManuel: true,
      motifRejet: null,
      dateSoumission: now,
      dateValidationAuto: now,
    })
    .eq('id', profile.id);

  await createNotification({
    userId: session.user.id,
    type: 'VALIDATION',
    titre: 'Profil approuvé ✓',
    corps: 'Félicitations ! Votre profil est validé : il est désormais visible par les clients sur la plateforme.',
    lien: '/mon-profil',
  });

  return NextResponse.json({ ok: true, statut: 'APPROUVE' });
}
