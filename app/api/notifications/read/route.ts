import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Marque toutes les notifications de l'utilisateur comme lues.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  await supabaseAdmin()
    .from('Notification')
    .update({ lu: true })
    .eq('userId', session.user.id)
    .eq('lu', false);

  return NextResponse.json({ ok: true });
}
