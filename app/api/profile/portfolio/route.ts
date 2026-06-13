import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { saveUpload, validateImage } from '@/lib/upload';
import { requireFreelanceProfile, recomputeVerification } from '@/lib/profile-server';

// Ajout d'une ou plusieurs images au portfolio.
export async function POST(req: Request) {
  const guard = await requireFreelanceProfile();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const sb = supabaseAdmin();

  const form = await req.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: 'Aucune image reçue.' }, { status: 400 });
  }

  const { data: last } = await sb
    .from('PortfolioItem')
    .select('ordre')
    .eq('profileId', guard.profileId)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle();
  let ordre = ((last?.ordre as number | undefined) ?? -1) + 1;

  const created: { id: string; imageUrl: string }[] = [];
  for (const file of files) {
    if (validateImage(file)) continue;
    const url = await saveUpload(file);
    const { data: item } = await sb
      .from('PortfolioItem')
      .insert({ profileId: guard.profileId, imageUrl: url, ordre: ordre++ })
      .select('id, imageUrl')
      .single();
    if (item) created.push(item as { id: string; imageUrl: string });
  }

  if (created.length === 0) {
    return NextResponse.json({ error: 'Images invalides (format ou taille).' }, { status: 400 });
  }

  const estVerifie = await recomputeVerification(guard.userId);
  return NextResponse.json({ ok: true, items: created, estVerifie });
}

// Suppression d'une image : ?id=...
export async function DELETE(req: Request) {
  const guard = await requireFreelanceProfile();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });

  await supabaseAdmin()
    .from('PortfolioItem')
    .delete()
    .eq('id', id)
    .eq('profileId', guard.profileId);
  const estVerifie = await recomputeVerification(guard.userId);
  return NextResponse.json({ ok: true, estVerifie });
}
