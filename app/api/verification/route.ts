import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifChecks } from '@/lib/verification';

export const dynamic = 'force-dynamic';

// Renvoie l'état frais des critères de vérification du freelance connecté.
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'FREELANCE') {
    return NextResponse.json({ checks: [] });
  }

  const { data: user } = await supabaseAdmin()
    .from('User')
    .select(
      'telephoneMomo, profile:Profile(photoUrl, titre, bio, cvUrl, services:Service(id), portfolio:PortfolioItem(id))'
    )
    .eq('id', session.user.id)
    .maybeSingle();

  const profile = (user?.profile ?? null) as unknown as {
    photoUrl: string | null;
    titre: string | null;
    bio: string | null;
    cvUrl: string | null;
    services: unknown[];
    portfolio: unknown[];
  } | null;

  const checks = getVerifChecks({
    photoUrl: profile?.photoUrl,
    titre: profile?.titre,
    bio: profile?.bio,
    cvUrl: profile?.cvUrl,
    portfolioCount: (profile?.portfolio ?? []).length,
    servicesCount: (profile?.services ?? []).length,
    telephoneMomo: user?.telephoneMomo,
  });

  return NextResponse.json({ checks });
}
