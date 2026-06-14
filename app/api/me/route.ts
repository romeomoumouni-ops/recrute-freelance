import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getConversationsFor } from '@/lib/conversations';

// Infos légères pour le header : photo + compteur de messages non lus.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ authenticated: false });

  const userId = session.user.id;

  const [{ data: profile }, convs, { count: notifUnread }, { count: supportUnread }] = await Promise.all([
    supabaseAdmin().from('Profile').select('photoUrl').eq('userId', userId).maybeSingle(),
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
  ]);

  const unread = convs.reduce((s, c) => s + c.unread, 0);

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
  });
}
