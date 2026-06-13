import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { registerSchema } from '@/lib/validations';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }

  const { prenom, email, password, role, pays, telephoneMomo } = parsed.data;
  const sb = supabaseAdmin();

  const { data: existing } = await sb.from('User').select('id').eq('email', email).maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: 'Un compte existe déjà avec cette adresse e-mail.' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: user, error } = await sb
    .from('User')
    .insert({
      email,
      passwordHash,
      prenom,
      role,
      pays: role === 'FREELANCE' ? pays : null,
      telephoneMomo: role === 'FREELANCE' ? telephoneMomo || null : null,
    })
    .select('id')
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Création impossible.' }, { status: 500 });
  }

  // Le freelance a un profil dès l'inscription pour pouvoir le compléter.
  if (role === 'FREELANCE') {
    await sb.from('Profile').insert({ userId: user.id, skills: '[]' });
  }

  return NextResponse.json({ ok: true });
}
