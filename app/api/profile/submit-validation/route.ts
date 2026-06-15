import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isVerified } from '@/lib/verification';

export const dynamic = 'force-dynamic';

// Le freelance soumet sa demande de validation. Exige TOUS les critères remplis.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.role !== 'FREELANCE')
    return NextResponse.json({ error: 'Réservé aux freelances.' }, { status: 403 });
  if (session.user.banni) return NextResponse.json({ error: 'Compte suspendu.' }, { status: 403 });

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

  await sb
    .from('Profile')
    .update({ statutValidation: 'EN_ATTENTE', dateSoumission: new Date().toISOString(), motifRejet: null })
    .eq('id', profile.id);

  return NextResponse.json({ ok: true, statut: 'EN_ATTENTE' });
}
