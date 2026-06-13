import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { serviceSchema } from '@/lib/validations';
import { requireFreelanceProfile, recomputeVerification } from '@/lib/profile-server';

export async function POST(req: Request) {
  const guard = await requireFreelanceProfile();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const sb = supabaseAdmin();

  const body = await req.json().catch(() => null);
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }
  const { titre, description, prix, delaiJours } = parsed.data;

  const { data: service, error } = await sb
    .from('Service')
    .insert({ profileId: guard.profileId, titre, description, prix, delaiJours })
    .select('id, titre, description, prix, delaiJours')
    .single();
  if (error || !service) {
    return NextResponse.json({ error: 'Création impossible.' }, { status: 500 });
  }

  // Premier service : on initialise un tarif journalier indicatif si absent.
  const { data: prof } = await sb
    .from('Profile')
    .select('tarifJour')
    .eq('id', guard.profileId)
    .maybeSingle();
  if (prof && prof.tarifJour == null) {
    await sb
      .from('Profile')
      .update({ tarifJour: Math.max(1, Math.round(prix / Math.max(1, delaiJours))) })
      .eq('id', guard.profileId);
  }

  const estVerifie = await recomputeVerification(guard.userId);
  return NextResponse.json({ ok: true, service, estVerifie });
}

// Suppression : ?id=...
export async function DELETE(req: Request) {
  const guard = await requireFreelanceProfile();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });

  await supabaseAdmin().from('Service').delete().eq('id', id).eq('profileId', guard.profileId);
  const estVerifie = await recomputeVerification(guard.userId);
  return NextResponse.json({ ok: true, estVerifie });
}
