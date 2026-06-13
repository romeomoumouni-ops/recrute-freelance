import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { compteSchema, momoSchema, notifSchema } from '@/lib/validations';
import { recomputeVerification } from '@/lib/profile-server';

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  const userId = session.user.id;
  const sb = supabaseAdmin();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || !('section' in body)) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const section = (body as { section: string }).section;

  // ----- Compte -----
  if (section === 'compte') {
    const parsed = compteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
        { status: 400 }
      );
    }
    const { prenom, email, pays } = parsed.data;
    const { data: dup } = await sb
      .from('User')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();
    if (dup) return NextResponse.json({ error: 'Cet e-mail est déjà utilisé.' }, { status: 409 });

    await sb
      .from('User')
      .update({
        prenom,
        email,
        ...(session.user.role === 'FREELANCE' ? { pays: pays || null } : {}),
      })
      .eq('id', userId);
    return NextResponse.json({ ok: true });
  }

  // ----- Paiement Mobile Money (freelance) -----
  if (section === 'momo') {
    if (session.user.role !== 'FREELANCE') {
      return NextResponse.json({ error: 'Réservé aux freelances.' }, { status: 403 });
    }
    const parsed = momoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }
    const { telephoneMomo, operateurMomo } = parsed.data;
    await sb
      .from('User')
      .update({ telephoneMomo: telephoneMomo || null, operateurMomo: operateurMomo ?? null })
      .eq('id', userId);
    const estVerifie = await recomputeVerification(userId);
    return NextResponse.json({ ok: true, estVerifie });
  }

  // ----- Notifications -----
  if (section === 'notifs') {
    const parsed = notifSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }
    await sb.from('User').update({ notifPrefs: JSON.stringify(parsed.data) }).eq('id', userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Section inconnue.' }, { status: 400 });
}
