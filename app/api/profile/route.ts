import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { profileSchema, isValidCat } from '@/lib/validations';
import { requireFreelanceProfile, recomputeVerification } from '@/lib/profile-server';

// Met à jour titre / bio / compétences / catégorie.
export async function PATCH(req: Request) {
  const guard = await requireFreelanceProfile();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }
  const { titre, bio, note, skills, cat } = parsed.data;

  await supabaseAdmin()
    .from('Profile')
    .update({
      titre: titre || null,
      bio: bio || null,
      note: note || null,
      skills: JSON.stringify(skills),
      cat: isValidCat(cat) ? cat : null,
    })
    .eq('id', guard.profileId);

  const estVerifie = await recomputeVerification(guard.userId);
  return NextResponse.json({ ok: true, estVerifie });
}
