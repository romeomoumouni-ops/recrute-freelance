import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { saveUpload, validateDoc } from '@/lib/upload';
import { requireFreelanceProfile, recomputeVerification } from '@/lib/profile-server';

export async function POST(req: Request) {
  const guard = await requireFreelanceProfile();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }
  const err = validateDoc(file);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const url = await saveUpload(file);
  await supabaseAdmin()
    .from('Profile')
    .update({ cvUrl: url, cvName: file.name })
    .eq('id', guard.profileId);
  const estVerifie = await recomputeVerification(guard.userId);
  return NextResponse.json({ ok: true, cvName: file.name, cvUrl: url, estVerifie });
}

export async function DELETE() {
  const guard = await requireFreelanceProfile();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  await supabaseAdmin()
    .from('Profile')
    .update({ cvUrl: null, cvName: null })
    .eq('id', guard.profileId);
  const estVerifie = await recomputeVerification(guard.userId);
  return NextResponse.json({ ok: true, estVerifie });
}
