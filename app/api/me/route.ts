import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getConversationsFor } from '@/lib/conversations';
import { computeAbonnement, getAbonnementUrl, type AbonnementStatus } from '@/lib/abonnement';

// Infos légères pour le header : photo + compteur de messages non lus.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ authenticated: false });

  const userId = session.user.id;
  // Les comptes admin ne sont jamais soumis à l'abonnement.
  const isFreelance = session.user.role === 'FREELANCE' && !session.user.admin;

  const [{ data: profile }, { data: userRow }, convs, { count: notifUnread }, { count: supportUnread }, abonnementUrl] = await Promise.all([
    supabaseAdmin().from('Profile').select('photoUrl, abonnementValidUntil').eq('userId', userId).maybeSingle(),
    supabaseAdmin().from('User').select('createdAt').eq('id', userId).maybeSingle(),
    getConversationsFor(userId),
    supabaseAdmin()
      .from('Notification')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('lu', false),
    supabaseAdmin()
      .from('SupportMessage')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('fromAdmin', true)
      .eq('lu', false),
    isFreelance ? getAbonnementUrl() : Promise.resolve(''),
  ]);

  const unread = convs.reduce((s, c) => s + c.unread, 0);

  let abonnement: AbonnementStatus | null = null;
  if (isFreelance && userRow?.createdAt) {
    abonnement = computeAbonnement(userRow.createdAt, profile?.abonnementValidUntil ?? null);
  }

  return NextResponse.json({
    authenticated: true,
    id: userId,
    prenom: session.user.prenom,
    role: session.user.role,
    photoUrl: profile?.photoUrl ?? null,
    banni: session.user.banni,
    unread,
    notifUnread: notifUnread ?? 0,
    supportUnread: supportUnread ?? 0,
    abonnement,
    abonnementUrl: abonnementUrl || '',
  });
}
